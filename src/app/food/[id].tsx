import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { AppIcon } from '@/components/app-icon';
import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { MacroBits } from '@/components/macro-bits';
import { StyledSafeAreaView } from '@/components/styled';
import { ThemedText } from '@/components/themed-text';
import { MacroBgClass, MacroLabels, MacroTextClass, MealLabels } from '@/constants/macros';
import { db } from '@/db/client';
import { addLogEntry, dayEntriesQuery, DEFAULT_GOALS, goalsQuery, setFoodFavorite } from '@/db/repo';
import { foods, type FoodRow, type Meal } from '@/db/schema';
import { cn } from '@/lib/cn';
import { formatAmount, formatKcal, scaleMacros, sumMacros } from '@/lib/macros';
import { defaultMealForTime, isMeal } from '@/lib/meals';
import { useSelectedDate } from '@/lib/selected-date';

const PRESETS = [100, 150, 200, 250];
const GRAM_STEP = 10;

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
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ meal?: string }>();
  const meal: Meal = isMeal(params.meal) ? params.meal : defaultMealForTime();
  const [date] = useSelectedDate();
  const [grams, setGrams] = useState(() =>
    food.servingGrams && food.servingGrams > 0 ? Math.round(food.servingGrams) : 100,
  );
  const [saving, setSaving] = useState(false);
  const [foreground] = useCSSVariable(['--color-foreground']) as string[];

  const { data: entries } = useLiveQuery(dayEntriesQuery(date), [date]);
  const { data: goalRows } = useLiveQuery(goalsQuery());
  const goals = goalRows[0] ?? DEFAULT_GOALS;
  const logged = sumMacros(entries);
  const valid = grams > 0;
  const macros = scaleMacros(food, valid ? grams : 0);
  const presets = presetsFor(food.servingGrams);

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

  const mealName = meal === 'snack' ? 'Snacks' : MealLabels[meal];

  return (
    <View className="flex-1 bg-background">
      <StyledSafeAreaView edges={['top']} className="flex-1">
        <View className="flex-row items-center justify-between px-4 py-2">
          <IconButton ios="chevron.left" android="chevron_left" label="Back" onPress={() => router.back()} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={food.favorite ? 'Remove favorite' : 'Add favorite'}
            onPress={() => setFoodFavorite(food.id, !food.favorite)}
            className="w-10 h-10 rounded-full items-center justify-center bg-background-selected active:opacity-70">
            <AppIcon
              ios={food.favorite ? 'star.fill' : 'star'}
              android={food.favorite ? 'favorite' : 'star'}
              size={18}
              color={food.favorite ? '#f5b400' : foreground}
            />
          </Pressable>
        </View>

        <ScrollView
          contentContainerClassName="px-4 pt-2 gap-4"
          contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="gap-1">
            <ThemedText className="text-[28px] leading-[34px] font-bold">{food.name}</ThemedText>
            {food.brand ? (
              <ThemedText type="small" className="text-foreground-secondary">
                {food.brand}
              </ThemedText>
            ) : null}
            <ThemedText type="small" className="text-foreground-secondary">
              Per 100 g ·{' '}
              <MacroBits
                showKcal
                macros={{
                  kcal: food.kcal100,
                  protein: food.protein100,
                  carbs: food.carbs100,
                  fat: food.fat100,
                }}
              />
            </ThemedText>
          </View>

          <View className="p-4 rounded-3xl gap-4 bg-background-element">
            <View className="flex-row items-center justify-between">
              <IconButton
                ios="minus"
                android="remove"
                label="Decrease amount"
                onPress={() => setGrams((g) => Math.max(0, g - GRAM_STEP))}
              />
              <ThemedText className="text-[36px] leading-[42px] font-bold">{grams} g</ThemedText>
              <IconButton
                ios="plus"
                android="add"
                label="Increase amount"
                onPress={() => setGrams((g) => g + GRAM_STEP)}
              />
            </View>
            <View className="flex-row flex-wrap gap-2">
              {presets.map((preset) => {
                const selected = grams === preset.grams;
                return (
                  <Pressable
                    key={preset.label}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setGrams(preset.grams)}
                    className={cn(
                      'px-4 py-2 rounded-full items-center',
                      selected ? 'bg-foreground' : 'bg-background-selected',
                    )}>
                    <ThemedText
                      type="small"
                      className={selected ? 'text-background' : 'text-foreground-secondary'}>
                      {preset.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <View className="flex-row">
              <MacroValue label="kcal" value={formatKcal(macros.kcal)} className="text-foreground" />
              <MacroValue label={MacroLabels.protein} value={`${formatAmount(macros.protein)} g`} className={MacroTextClass.protein} />
              <MacroValue label={MacroLabels.carbs} value={`${formatAmount(macros.carbs)} g`} className={MacroTextClass.carbs} />
              <MacroValue label={MacroLabels.fat} value={`${formatAmount(macros.fat)} g`} className={MacroTextClass.fat} />
            </View>
          </View>

          <View className="p-4 rounded-3xl gap-3 bg-background-element">
            <View className="flex-row items-center justify-between">
              <ThemedText type="smallBold">Your day after adding</ThemedText>
              <View className="flex-row gap-3">
                <Legend label="Logged" swatch="bg-foreground-secondary" />
                <Legend label="This food" swatch="bg-foreground-secondary opacity-40" />
              </View>
            </View>
            <Projection
              label="Calories"
              color={MacroBgClass.kcal}
              logged={logged.kcal}
              added={macros.kcal}
              goal={goals.kcal}
              format={(n) => `${formatKcal(n)} kcal`}
            />
            <Projection
              label="Protein"
              color={MacroBgClass.protein}
              logged={logged.protein}
              added={macros.protein}
              goal={goals.protein}
              format={(n) => `${formatAmount(n)} g`}
            />
            <Projection
              label="Carbs"
              color={MacroBgClass.carbs}
              logged={logged.carbs}
              added={macros.carbs}
              goal={goals.carbs}
              format={(n) => `${formatAmount(n)} g`}
            />
            <Projection
              label="Fat"
              color={MacroBgClass.fat}
              logged={logged.fat}
              added={macros.fat}
              goal={goals.fat}
              format={(n) => `${formatAmount(n)} g`}
            />
          </View>
        </ScrollView>
      </StyledSafeAreaView>

      <View className="px-4 pt-2 bg-background" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button
          title={`Add to ${mealName} · ${formatKcal(macros.kcal)} kcal`}
          onPress={save}
          disabled={!valid}
          loading={saving}
        />
      </View>
    </View>
  );
}

function presetsFor(servingGrams: number | null): { label: string; grams: number }[] {
  const presets = PRESETS.map((grams) => ({ label: `${grams} g`, grams }));
  if (servingGrams && servingGrams > 0 && !PRESETS.includes(Math.round(servingGrams))) {
    presets.push({ label: '1 serving', grams: Math.round(servingGrams) });
  }
  return presets;
}

function MacroValue({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <View className="flex-1">
      <ThemedText type="small" className="text-foreground-secondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold" className={cn('text-[18px] leading-[24px]', className)}>
        {value}
      </ThemedText>
    </View>
  );
}

function Legend({ label, swatch }: { label: string; swatch: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <View className={cn('w-2 h-2 rounded-sm', swatch)} />
      <ThemedText type="small" className="text-[12px] leading-[16px] text-foreground-secondary">
        {label}
      </ThemedText>
    </View>
  );
}

function Projection({
  label,
  color,
  logged,
  added,
  goal,
  format,
}: {
  label: string;
  color: string;
  logged: number;
  added: number;
  goal: number;
  format: (n: number) => string;
}) {
  const scale = goal > 0 ? goal : logged + added || 1;
  const loggedWidth = Math.min(100, (logged / scale) * 100);
  const addedWidth = Math.min(100 - loggedWidth, (added / scale) * 100);
  return (
    <View className="gap-1">
      <View className="flex-row items-baseline justify-between gap-2">
        <ThemedText type="small">{label}</ThemedText>
        <ThemedText type="small" className="text-foreground-secondary">
          {format(logged)} → {format(logged + added)} / {format(goal)}
        </ThemedText>
      </View>
      <View className="h-2 rounded-full overflow-hidden flex-row bg-background-selected">
        <View className={cn('h-full', color)} style={{ width: `${loggedWidth}%` }} />
        <View className={cn('h-full opacity-45', color)} style={{ width: `${addedWidth}%` }} />
      </View>
    </View>
  );
}
