import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/button';
import { EntryRow } from '@/components/entry-row';
import { MacroBar } from '@/components/macro-bar';
import { StyledSafeAreaView } from '@/components/styled';
import { ThemedText } from '@/components/themed-text';
import { MealLabels } from '@/constants/macros';
import { dayEntriesQuery, DEFAULT_GOALS, deleteLogEntry, goalsQuery } from '@/db/repo';
import { MEALS } from '@/db/schema';
import { addDays, formatDateLabel, toDateKey } from '@/lib/dates';
import { sumMacros } from '@/lib/macros';
import { useSelectedDate } from '@/lib/selected-date';

export default function TodayScreen() {
  const [date, setDate] = useSelectedDate();
  const { data: entries } = useLiveQuery(dayEntriesQuery(date), [date]);
  const { data: goalRows } = useLiveQuery(goalsQuery());
  const goals = goalRows[0] ?? DEFAULT_GOALS;
  const totals = sumMacros(entries);
  const isToday = date === toDateKey();

  return (
    <View className="flex-1 bg-background">
      <StyledSafeAreaView edges={['top']} className="flex-1">
        <ScrollView contentContainerClassName="px-4 pt-4 gap-6 web:pb-6 ios:pb-[74px] android:pb-[104px]">
          <View className="flex-row items-center justify-between">
            <DateArrow label="‹" onPress={() => setDate(addDays(date, -1))} />
            <Pressable onPress={() => setDate(toDateKey())} disabled={isToday}>
              <ThemedText type="subtitle">{formatDateLabel(date)}</ThemedText>
            </Pressable>
            <DateArrow label="›" onPress={() => setDate(addDays(date, 1))} />
          </View>

          <View className="p-4 rounded-3xl gap-4 bg-background-element">
            <View className="flex-row items-baseline gap-2">
              <ThemedText className="text-[40px] leading-[46px] font-bold">
                {Math.round(totals.kcal)}
              </ThemedText>
              <ThemedText type="small" className="text-foreground-secondary">
                / {Math.round(goals.kcal)} kcal
              </ThemedText>
            </View>
            <MacroBar macro="kcal" value={totals.kcal} goal={goals.kcal} />
            <MacroBar macro="protein" value={totals.protein} goal={goals.protein} />
            <MacroBar macro="carbs" value={totals.carbs} goal={goals.carbs} />
            <MacroBar macro="fat" value={totals.fat} goal={goals.fat} />
          </View>

          {MEALS.map((meal) => {
            const mealEntries = entries.filter((e) => e.meal === meal);
            const mealKcal = Math.round(sumMacros(mealEntries).kcal);
            return (
              <View key={meal} className="gap-2">
                <View className="flex-row justify-between">
                  <ThemedText type="smallBold">{MealLabels[meal]}</ThemedText>
                  <ThemedText type="small" className="text-foreground-secondary">
                    {mealKcal} kcal
                  </ThemedText>
                </View>
                {mealEntries.length === 0 ? (
                  <ThemedText type="small" className="text-foreground-secondary">
                    Nothing logged
                  </ThemedText>
                ) : (
                  <View className="rounded-2xl overflow-hidden gap-hairline">
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
                )}
              </View>
            );
          })}

          <Button title="Add food" onPress={() => router.navigate('/add')} />
        </ScrollView>
      </StyledSafeAreaView>
    </View>
  );
}

function DateArrow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={label === '‹' ? 'Previous day' : 'Next day'}
      className="px-4 active:opacity-50">
      <ThemedText type="subtitle" className="text-foreground-secondary">
        {label}
      </ThemedText>
    </Pressable>
  );
}
