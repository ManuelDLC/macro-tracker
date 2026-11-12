import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Button } from '@/components/button';
import { StyledSafeAreaView } from '@/components/styled';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { DEFAULT_GOALS, goalsQuery, setGoals } from '@/db/repo';
import { parseAmount } from '@/lib/meals';

type GoalKey = keyof typeof DEFAULT_GOALS;

const FIELDS: { key: GoalKey; label: string; suffix: string }[] = [
  { key: 'kcal', label: 'Calories', suffix: 'kcal' },
  { key: 'protein', label: 'Protein', suffix: 'g' },
  { key: 'carbs', label: 'Carbs', suffix: 'g' },
  { key: 'fat', label: 'Fat', suffix: 'g' },
];

function toText(goals: typeof DEFAULT_GOALS): Record<GoalKey, string> {
  return {
    kcal: String(Math.round(goals.kcal)),
    protein: String(Math.round(goals.protein)),
    carbs: String(Math.round(goals.carbs)),
    fat: String(Math.round(goals.fat)),
  };
}

export default function GoalsScreen() {
  const { data: rows, updatedAt } = useLiveQuery(goalsQuery());
  if (!updatedAt) return <View className="flex-1 bg-background" />;
  const saved = rows[0] ?? DEFAULT_GOALS;
  return <GoalsForm key={updatedAt.getTime()} saved={saved} />;
}

function GoalsForm({ saved }: { saved: typeof DEFAULT_GOALS }) {
  const [values, setValues] = useState(() => toText(saved));
  const [saving, setSaving] = useState(false);

  const parsed = {
    kcal: parseAmount(values.kcal),
    protein: parseAmount(values.protein),
    carbs: parseAmount(values.carbs),
    fat: parseAmount(values.fat),
  };
  const valid = Object.values(parsed).every((n) => n >= 0);
  const dirty = (Object.keys(parsed) as GoalKey[]).some(
    (k) => Math.round(parsed[k]) !== Math.round(saved[k]),
  );
  const macroKcal = valid ? parsed.protein * 4 + parsed.carbs * 4 + parsed.fat * 9 : 0;

  async function save() {
    setSaving(true);
    try {
      await setGoals(parsed);
      Keyboard.dismiss();
    } catch (e) {
      Alert.alert('Could not save goals', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <StyledSafeAreaView edges={['top']} className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerClassName="px-4 pt-4 gap-4 web:pb-6 ios:pb-[74px] android:pb-[104px]"
            keyboardShouldPersistTaps="handled">
            <ThemedText type="subtitle">Daily goals</ThemedText>

            {FIELDS.map((f) => (
              <TextField
                key={f.key}
                label={f.label}
                value={values[f.key]}
                onChangeText={(t) => setValues((v) => ({ ...v, [f.key]: t }))}
                keyboardType="number-pad"
                selectTextOnFocus
                suffix={f.suffix}
              />
            ))}

            {valid ? (
              <ThemedText type="small" className="text-foreground-secondary">
                Your macros add up to {Math.round(macroKcal)} kcal (4 kcal/g protein and carbs, 9
                kcal/g fat).
              </ThemedText>
            ) : (
              <ThemedText type="small" className="text-foreground-secondary">
                Enter a number for every goal.
              </ThemedText>
            )}

            <Button title="Save goals" onPress={save} disabled={!valid || !dirty} loading={saving} />
            {valid && Math.round(macroKcal) !== Math.round(parsed.kcal) ? (
              <Button
                title={`Set calories to ${Math.round(macroKcal)}`}
                variant="secondary"
                onPress={() => setValues((v) => ({ ...v, kcal: String(Math.round(macroKcal)) }))}
              />
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </StyledSafeAreaView>
    </View>
  );
}
