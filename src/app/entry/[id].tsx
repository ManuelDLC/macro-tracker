import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';

import { Button } from '@/components/button';
import { MacroTiles } from '@/components/macro-tiles';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { MealLabels } from '@/constants/macros';
import { db } from '@/db/client';
import { deleteLogEntry, updateLogEntryGrams } from '@/db/repo';
import { foods, logEntries } from '@/db/schema';
import { formatDateLabel } from '@/lib/dates';
import { parseAmount } from '@/lib/meals';

export default function EditEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entryId = Number(id);
  const { data, updatedAt } = useLiveQuery(
    db
      .select({ entry: logEntries, name: foods.name, brand: foods.brand })
      .from(logEntries)
      .innerJoin(foods, eq(logEntries.foodId, foods.id))
      .where(eq(logEntries.id, entryId)),
    [entryId],
  );
  const row = data[0];

  if (!row) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        {updatedAt ? (
          <ThemedText className="text-foreground-secondary">This entry no longer exists.</ThemedText>
        ) : (
          <ActivityIndicator />
        )}
      </View>
    );
  }

  return <EntryForm key={row.entry.id} {...row} />;
}

function EntryForm({
  entry,
  name,
  brand,
}: {
  entry: typeof logEntries.$inferSelect;
  name: string;
  brand: string | null;
}) {
  const [gramsText, setGramsText] = useState(String(Math.round(entry.grams * 10) / 10));
  const [saving, setSaving] = useState(false);
  const grams = parseAmount(gramsText);
  const valid = grams > 0;
  const ratio = valid && entry.grams > 0 ? grams / entry.grams : 0;

  async function save() {
    setSaving(true);
    try {
      await updateLogEntryGrams(entry.id, grams);
      router.back();
    } catch (e) {
      Alert.alert('Could not update entry', (e as Error).message);
      setSaving(false);
    }
  }

  async function remove() {
    await deleteLogEntry(entry.id);
    router.back();
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="p-4 gap-6">
      <View className="gap-1">
        <ThemedText type="smallBold" className="text-[22px] leading-[28px]">
          {name}
        </ThemedText>
        <ThemedText type="small" className="text-foreground-secondary">
          {[brand, MealLabels[entry.meal], formatDateLabel(entry.date)].filter(Boolean).join(' · ')}
        </ThemedText>
      </View>

      <TextField
        label="Amount"
        value={gramsText}
        onChangeText={setGramsText}
        keyboardType="decimal-pad"
        selectTextOnFocus
        autoFocus
        suffix="g"
      />

      <MacroTiles
        macros={{
          kcal: entry.kcal * ratio,
          protein: entry.protein * ratio,
          carbs: entry.carbs * ratio,
          fat: entry.fat * ratio,
        }}
      />

      <Button title="Save" onPress={save} disabled={!valid} loading={saving} />
      <Button title="Delete entry" variant="danger" onPress={remove} />
    </ScrollView>
  );
}
