import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';

import { Button } from '@/components/button';
import { MacroLine } from '@/components/macro-line';
import { MacroTiles } from '@/components/macro-tiles';
import { Segmented } from '@/components/segmented';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { MealLabels } from '@/constants/macros';
import { db } from '@/db/client';
import { addLogEntry } from '@/db/repo';
import { foods, MEALS, type FoodRow, type Meal } from '@/db/schema';
import { formatDateLabel } from '@/lib/dates';
import { round1, scaleMacros } from '@/lib/macros';
import { defaultMealForTime, parseAmount } from '@/lib/meals';
import { useSelectedDate } from '@/lib/selected-date';

const MEAL_OPTIONS = MEALS.map((m) => ({ value: m, label: MealLabels[m] }));

export default function FoodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const foodId = Number(id);
  const { data: food, updatedAt } = useLiveQuery(
    db.query.foods.findFirst({ where: eq(foods.id, foodId) }),
    [foodId],
  );

  if (!food) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        {updatedAt ? (
          <ThemedText className="text-foreground-secondary">This food no longer exists.</ThemedText>
        ) : (
          <ActivityIndicator />
        )}
      </View>
    );
  }

  return <FoodForm key={food.id} food={food} />;
}

function FoodForm({ food }: { food: FoodRow }) {
  const [date] = useSelectedDate();
  const hasServing = !!food.servingGrams && food.servingGrams > 0;
  const [unit, setUnit] = useState<'serving' | 'g'>(hasServing ? 'serving' : 'g');
  const [amountText, setAmountText] = useState(hasServing ? '1' : '100');
  const [meal, setMeal] = useState<Meal>(defaultMealForTime());
  const [saving, setSaving] = useState(false);

  const amount = parseAmount(amountText);
  const grams = unit === 'serving' ? amount * (food.servingGrams ?? 0) : amount;
  const valid = Number.isFinite(grams) && grams > 0;
  const macros = scaleMacros(food, valid ? grams : 0);

  function changeUnit(next: 'serving' | 'g') {
    if (next === unit) return;
    if (valid && food.servingGrams) {
      setAmountText(
        String(next === 'g' ? Math.round(grams) : round1(grams / food.servingGrams)),
      );
    }
    setUnit(next);
  }

  async function save() {
    if (!valid) return;
    setSaving(true);
    try {
      await addLogEntry({ foodId: food.id, date, meal, grams });
      router.dismissTo('/');
    } catch (e) {
      Alert.alert('Could not add food', (e as Error).message);
      setSaving(false);
    }
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="p-4 gap-6">
      <Stack.Screen options={{ title: food.source === 'custom' ? 'Custom food' : 'Add food' }} />

      <View className="gap-1">
        <ThemedText type="smallBold" className="text-[22px] leading-[28px]">
          {food.name}
        </ThemedText>
        {food.brand ? (
          <ThemedText type="small" className="text-foreground-secondary">
            {food.brand}
          </ThemedText>
        ) : null}
        <MacroLine
          macros={{
            kcal: food.kcal100,
            protein: food.protein100,
            carbs: food.carbs100,
            fat: food.fat100,
          }}
        />
        <ThemedText type="small" className="text-foreground-secondary">
          per 100 g{hasServing ? ` · 1 serving = ${round1(food.servingGrams!)} g` : ''}
        </ThemedText>
      </View>

      <View className="gap-2">
        {hasServing ? (
          <Segmented
            options={[
              { value: 'serving', label: 'Servings' },
              { value: 'g', label: 'Grams' },
            ]}
            value={unit}
            onChange={changeUnit}
          />
        ) : null}
        <TextField
          label="Amount"
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="decimal-pad"
          selectTextOnFocus
          suffix={unit === 'g' ? 'g' : `serving${amount === 1 ? '' : 's'}`}
        />
        {unit === 'serving' && valid ? (
          <ThemedText type="small" className="text-foreground-secondary">
            = {Math.round(grams)} g
          </ThemedText>
        ) : null}
      </View>

      <View className="gap-2">
        <ThemedText type="small" className="text-foreground-secondary">
          Meal
        </ThemedText>
        <Segmented options={MEAL_OPTIONS} value={meal} onChange={setMeal} />
      </View>

      <MacroTiles macros={macros} />

      <Button
        title={`Add to ${formatDateLabel(date)}`}
        onPress={save}
        disabled={!valid}
        loading={saving}
      />
    </ScrollView>
  );
}
