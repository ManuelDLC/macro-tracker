import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { DEFAULT_GOALS, goalsQuery, setGoals } from '@/db/repo';
import { cn } from '@/lib/cn';
import { carbsForCalorieGoal, energyFromMacros, formatKcal } from '@/lib/macros';

import type { GoalsRow } from '@/db/schema';

type Goals = Omit<GoalsRow, 'id'>;

const KCAL_STEP = 50;
const GRAM_STEP = 5;

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const { data: rows, updatedAt } = useLiveQuery(goalsQuery());
  const row = rows[0];
  const saved: Goals = row
    ? { kcal: row.kcal, protein: row.protein, carbs: row.carbs, fat: row.fat }
    : DEFAULT_GOALS;

  if (!updatedAt) return <View className="flex-1 bg-background" />;

  const proteinKcal = saved.protein * 4;
  const carbsKcal = saved.carbs * 4;
  const fatKcal = saved.fat * 9;
  const macroKcal = energyFromMacros(saved.protein, saved.carbs, saved.fat);
  const mismatch = Math.round(macroKcal) !== Math.round(saved.kcal);
  const share = macroKcal > 0 ? macroKcal : 1;

  async function update(next: Goals) {
    try {
      await setGoals(next);
    } catch (e) {
      Alert.alert('Could not save goals', (e as Error).message);
    }
  }

  function step(key: keyof Goals, delta: number) {
    return update({ ...saved, [key]: Math.max(0, Math.round(saved[key] + delta)) });
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="px-4 pt-4 gap-3"
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 108 }}>
        <ThemedText type="subtitle">Goals</ThemedText>

        <View className="p-4 rounded-3xl bg-background-element flex-row items-center gap-3">
          <View className="flex-1">
            <ThemedText type="small" className="text-foreground-secondary">
              Daily calories
            </ThemedText>
            <ThemedText className="text-[32px] leading-[38px] font-bold">
              {formatKcal(saved.kcal)}{' '}
              <ThemedText type="small" className="text-foreground-secondary">
                kcal
              </ThemedText>
            </ThemedText>
          </View>
          <Stepper
            label="calories"
            onMinus={() => step('kcal', -KCAL_STEP)}
            onPlus={() => step('kcal', KCAL_STEP)}
          />
        </View>

        <MacroGoal
          name="Protein"
          dot="bg-protein"
          grams={saved.protein}
          kcal={proteinKcal}
          goalKcal={saved.kcal}
          onMinus={() => step('protein', -GRAM_STEP)}
          onPlus={() => step('protein', GRAM_STEP)}
        />
        <MacroGoal
          name="Carbs"
          dot="bg-carbs"
          grams={saved.carbs}
          kcal={carbsKcal}
          goalKcal={saved.kcal}
          onMinus={() => step('carbs', -GRAM_STEP)}
          onPlus={() => step('carbs', GRAM_STEP)}
        />
        <MacroGoal
          name="Fat"
          dot="bg-fat"
          grams={saved.fat}
          kcal={fatKcal}
          goalKcal={saved.kcal}
          onMinus={() => step('fat', -GRAM_STEP)}
          onPlus={() => step('fat', GRAM_STEP)}
        />

        <View className="p-4 rounded-3xl gap-3 bg-background-element">
          <View className="flex-row items-baseline justify-between">
            <ThemedText type="small" className="text-foreground-secondary">
              Macros add up to
            </ThemedText>
            <ThemedText type="smallBold">{formatKcal(macroKcal)} kcal</ThemedText>
          </View>
          <View className="h-2.5 flex-row rounded-full overflow-hidden bg-background-selected">
            <View className="h-full bg-protein" style={{ width: `${(proteinKcal / share) * 100}%` }} />
            <View className="h-full bg-carbs" style={{ width: `${(carbsKcal / share) * 100}%` }} />
            <View className="h-full bg-fat" style={{ width: `${(fatKcal / share) * 100}%` }} />
          </View>
        </View>

        {mismatch ? (
          <View className="p-4 rounded-3xl gap-3 bg-warning-surface">
            <View className="flex-row gap-2">
              <AppIcon ios="exclamationmark.triangle.fill" android="warning" size={18} color="#e6b450" />
              <ThemedText type="small" className="flex-1 text-warning">
                Your macro targets add up to {formatKcal(macroKcal)} kcal,{' '}
                {formatKcal(Math.abs(macroKcal - saved.kcal))}{' '}
                {macroKcal > saved.kcal ? 'more' : 'less'} than your {formatKcal(saved.kcal)} kcal
                goal. Hitting one means missing the other.
              </ThemedText>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  update({
                    ...saved,
                    carbs: carbsForCalorieGoal(saved.kcal, saved.protein, saved.fat),
                  })
                }
                className="flex-1 py-3 rounded-full items-center bg-carbs active:opacity-80">
                <ThemedText type="smallBold" className="text-black">
                  Adjust carbs to fit
                </ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  update({
                    ...saved,
                    kcal: Math.round(energyFromMacros(saved.protein, saved.carbs, saved.fat)),
                  })
                }
                className="flex-1 py-3 rounded-full items-center border border-carbs active:opacity-80">
                <ThemedText type="smallBold" className="text-carbs">
                  Use {formatKcal(macroKcal)} kcal
                </ThemedText>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function MacroGoal({
  name,
  dot,
  grams,
  kcal,
  goalKcal,
  onMinus,
  onPlus,
}: {
  name: string;
  dot: string;
  grams: number;
  kcal: number;
  goalKcal: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const percent = goalKcal > 0 ? Math.round((kcal / goalKcal) * 100) : 0;
  return (
    <View className="p-4 rounded-3xl bg-background-element flex-row items-center gap-3">
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <View className={cn('w-2 h-2 rounded-full', dot)} />
          <ThemedText type="smallBold">{name}</ThemedText>
        </View>
        <ThemedText type="small" className="text-foreground-secondary">
          {formatKcal(kcal)} kcal · {percent}% of goal
        </ThemedText>
      </View>
      <Stepper label={name} value={`${Math.round(grams)} g`} onMinus={onMinus} onPlus={onPlus} />
    </View>
  );
}

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value?: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <RoundButton icon="minus" android="remove" label={`Decrease ${label}`} onPress={onMinus} />
      {value ? <ThemedText className="min-w-16 text-center text-[20px] leading-[26px] font-bold">{value}</ThemedText> : null}
      <RoundButton icon="plus" android="add" label={`Increase ${label}`} onPress={onPlus} />
    </View>
  );
}

function RoundButton({
  icon,
  android,
  label,
  onPress,
}: {
  icon: 'minus' | 'plus';
  android: 'remove' | 'add';
  label: string;
  onPress: () => void;
}) {
  const [foreground] = useCSSVariable(['--color-foreground']) as string[];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="w-10 h-10 rounded-full items-center justify-center bg-background-selected active:opacity-70">
      <AppIcon ios={icon} android={android} size={18} color={foreground} />
    </Pressable>
  );
}
