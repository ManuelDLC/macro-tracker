import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { EntryRow } from '@/components/entry-row';
import { IconButton } from '@/components/icon-button';
import { KcalRing } from '@/components/kcal-ring';
import { StyledSafeAreaView } from '@/components/styled';
import { ThemedText } from '@/components/themed-text';
import { MacroBgClass, MacroLabels, MealLabels } from '@/constants/macros';
import { dayEntriesQuery, DEFAULT_GOALS, deleteLogEntry, goalsQuery } from '@/db/repo';
import { MEALS, type Meal } from '@/db/schema';
import { addDays, formatDateLabel, formatShortDate, toDateKey } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { formatAmount, formatKcal, progress, sumMacros } from '@/lib/macros';
import { defaultMealForTime } from '@/lib/meals';
import { useSelectedDate } from '@/lib/selected-date';

const MEAL_HINT: Record<Meal, string> = {
  breakfast: "It's breakfast time",
  lunch: "It's lunchtime",
  dinner: "It's dinnertime",
  snack: "It's snack time",
};

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useSelectedDate();
  const { data: entries } = useLiveQuery(dayEntriesQuery(date), [date]);
  const { data: goalRows } = useLiveQuery(goalsQuery());
  const goals = goalRows[0] ?? DEFAULT_GOALS;
  const totals = sumMacros(entries);
  const currentMeal = defaultMealForTime();
  const isToday = date === toDateKey();

  function openAdd(meal: Meal) {
    router.push({ pathname: '/add', params: { meal } });
  }

  return (
    <View className="flex-1 bg-background">
      <StyledSafeAreaView edges={['top']} className="flex-1">
        <ScrollView
          contentContainerClassName="px-4 pt-2 gap-4"
          contentContainerStyle={{ paddingBottom: insets.bottom + 108 }}>
          <View className="flex-row items-center justify-between">
            <View>
              <ThemedText type="small" className="text-foreground-secondary">
                {formatShortDate(date)}
              </ThemedText>
              <ThemedText type="subtitle">{formatDateLabel(date)}</ThemedText>
            </View>
            <View className="flex-row gap-2">
              <IconButton
                ios="chevron.left"
                android="chevron_left"
                label="Previous day"
                onPress={() => setDate(addDays(date, -1))}
              />
              <IconButton
                ios="chevron.right"
                android="chevron_right"
                label="Next day"
                onPress={() => setDate(addDays(date, 1))}
              />
            </View>
          </View>

          <View className="p-4 rounded-3xl bg-background-element gap-5">
            <View className="flex-row items-center gap-4">
              <KcalRing eaten={totals.kcal} goal={goals.kcal} />
              <View className="flex-1 gap-4">
                <Stat label="Eaten" value={`${formatKcal(totals.kcal)} kcal`} />
                <Stat label="Goal" value={`${formatKcal(goals.kcal)} kcal`} />
              </View>
            </View>
            <View className="flex-row gap-3">
              <MacroColumn label={MacroLabels.protein} color={MacroBgClass.protein} value={totals.protein} goal={goals.protein} />
              <MacroColumn label={MacroLabels.carbs} color={MacroBgClass.carbs} value={totals.carbs} goal={goals.carbs} />
              <MacroColumn label={MacroLabels.fat} color={MacroBgClass.fat} value={totals.fat} goal={goals.fat} />
            </View>
          </View>

          {MEALS.map((meal) => {
            const mealEntries = entries.filter((e) => e.meal === meal);
            const mealKcal = Math.round(sumMacros(mealEntries).kcal);
            const empty = mealEntries.length === 0;
            const highlight = empty && isToday && meal === currentMeal;
            const addLabel = meal === 'snack' ? 'Add snack' : `Add ${MealLabels[meal].toLowerCase()}`;
            return (
              <View
                key={meal}
                className={cn(
                  'p-4 rounded-3xl gap-3 bg-background-element',
                  highlight && 'border border-primary',
                )}>
                <View className="flex-row items-center gap-3">
                  <View className="flex-1 gap-0.5">
                    <ThemedText type="smallBold" className="text-[18px] leading-[24px]">
                      {MealLabels[meal]}
                      {mealKcal > 0 ? (
                        <ThemedText type="small" className="text-foreground-secondary">
                          {'  '}
                          {mealKcal} kcal
                        </ThemedText>
                      ) : null}
                    </ThemedText>
                    {empty ? (
                      <ThemedText type="small" className="text-foreground-secondary">
                        {highlight ? `${MEAL_HINT[meal]} · nothing logged` : 'Nothing logged'}
                      </ThemedText>
                    ) : null}
                  </View>
                  {empty && highlight ? (
                    <Button title={addLabel} onPress={() => openAdd(meal)} className="px-4" />
                  ) : empty ? (
                    <IconButton
                      ios="plus"
                      android="add"
                      label={addLabel}
                      variant="primary"
                      size={36}
                      onPress={() => openAdd(meal)}
                    />
                  ) : null}
                </View>
                {mealEntries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    onPress={() =>
                      router.push({ pathname: '/entry/[id]', params: { id: String(entry.id) } })
                    }
                    onDelete={() => deleteLogEntry(entry.id)}
                  />
                ))}
              </View>
            );
          })}
        </ScrollView>
      </StyledSafeAreaView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <ThemedText type="small" className="text-foreground-secondary">
        {label}
      </ThemedText>
      <ThemedText className="text-[22px] leading-[28px] font-bold">{value}</ThemedText>
    </View>
  );
}

function MacroColumn({
  label,
  color,
  value,
  goal,
}: {
  label: string;
  color: string;
  value: number;
  goal: number;
}) {
  const over = goal > 0 && value > goal;
  const remaining = Math.round(goal - value);
  return (
    <View className="flex-1 gap-1.5">
      <View className="flex-row items-center gap-1.5">
        <View className={cn('w-2 h-2 rounded-full', color)} />
        <ThemedText type="small" className="text-foreground-secondary">
          {label}
        </ThemedText>
      </View>
      <ThemedText className="text-[16px] leading-[22px] font-bold">
        {formatAmount(value)}
        <ThemedText type="small" className="text-foreground-secondary">
          {' '}
          / {Math.round(goal)} g
        </ThemedText>
      </ThemedText>
      <View className="h-1.5 rounded-full overflow-hidden bg-background-selected">
        <View className={cn('h-full rounded-full', color)} style={{ width: `${progress(value, goal) * 100}%` }} />
      </View>
      <ThemedText type="small" className={over ? 'text-protein' : 'text-foreground-secondary'}>
        {over ? `${-remaining} g over` : `${remaining} g left`}
      </ThemedText>
    </View>
  );
}
