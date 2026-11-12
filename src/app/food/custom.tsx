import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Button } from '@/components/button';
import { Segmented } from '@/components/segmented';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { upsertFood } from '@/db/repo';
import { parseAmount } from '@/lib/meals';

type Basis = '100g' | 'serving';
type MacroField = 'kcal' | 'protein' | 'carbs' | 'fat';

const MACRO_FIELDS: { key: MacroField; label: string; suffix: string }[] = [
  { key: 'kcal', label: 'Calories', suffix: 'kcal' },
  { key: 'protein', label: 'Protein', suffix: 'g' },
  { key: 'carbs', label: 'Carbs', suffix: 'g' },
  { key: 'fat', label: 'Fat', suffix: 'g' },
];

export default function CustomFoodScreen() {
  const params = useLocalSearchParams<{ barcode?: string; name?: string; meal?: string }>();
  const barcode = params.barcode?.trim() || null;

  const [name, setName] = useState(params.name ?? '');
  const [brand, setBrand] = useState('');
  const [servingText, setServingText] = useState('');
  const [basis, setBasis] = useState<Basis>('serving');
  const [values, setValues] = useState<Record<MacroField, string>>({
    kcal: '',
    protein: '',
    carbs: '',
    fat: '',
  });
  const [saving, setSaving] = useState(false);

  const serving = parseAmount(servingText);
  const hasServing = Number.isFinite(serving) && serving > 0;
  const kcal = parseAmount(values.kcal);
  const macroNums = {
    protein: parseAmount(values.protein || '0'),
    carbs: parseAmount(values.carbs || '0'),
    fat: parseAmount(values.fat || '0'),
  };

  const errors: string[] = [];
  if (!name.trim()) errors.push('Enter a name.');
  if (!(kcal >= 0)) errors.push('Enter calories.');
  if (Object.values(macroNums).some((n) => !(n >= 0))) errors.push('Macros must be numbers.');
  if (basis === 'serving' && !hasServing) errors.push('Enter the serving size in grams.');
  const valid = errors.length === 0;

  async function save() {
    if (!valid) return;
    const factor = basis === 'serving' ? 100 / serving : 1;
    setSaving(true);
    try {
      const id = await upsertFood({
        barcode,
        name: name.trim(),
        brand: brand.trim() || null,
        kcal100: kcal * factor,
        protein100: macroNums.protein * factor,
        carbs100: macroNums.carbs * factor,
        fat100: macroNums.fat * factor,
        servingGrams: hasServing ? serving : null,
        source: 'custom',
      });
      router.replace({ pathname: '/food/[id]', params: { id: String(id), meal: params.meal } });
    } catch (e) {
      Alert.alert('Could not save food', (e as Error).message);
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="p-4 gap-4">
          {barcode ? (
            <View className="p-4 rounded-2xl gap-1 bg-background-element">
              <ThemedText type="smallBold">Barcode {barcode} wasn’t found</ThemedText>
              <ThemedText type="small" className="text-foreground-secondary">
                Enter the nutrition facts from the label. Next time you scan it, it’ll load
                instantly.
              </ThemedText>
            </View>
          ) : null}

          <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Protein bar" />
          <TextField label="Brand (optional)" value={brand} onChangeText={setBrand} />
          <TextField
            label={basis === 'serving' ? 'Serving size' : 'Serving size (optional)'}
            value={servingText}
            onChangeText={setServingText}
            keyboardType="decimal-pad"
            suffix="g"
          />

          <View className="gap-2">
            <ThemedText type="small" className="text-foreground-secondary">
              Nutrition values are per
            </ThemedText>
            <Segmented
              options={[
                { value: 'serving', label: 'Serving' },
                { value: '100g', label: '100 g' },
              ]}
              value={basis}
              onChange={setBasis}
            />
          </View>

          <View className="flex-row flex-wrap gap-2">
            {MACRO_FIELDS.map((f) => (
              <View key={f.key} className="w-[48%] grow">
                <TextField
                  label={f.label}
                  value={values[f.key]}
                  onChangeText={(t) => setValues((v) => ({ ...v, [f.key]: t }))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  suffix={f.suffix}
                />
              </View>
            ))}
          </View>

          {!valid && (name || values.kcal) ? (
            <ThemedText type="small" className="text-foreground-secondary">
              {errors[0]}
            </ThemedText>
          ) : null}

          <Button title="Save food" onPress={save} disabled={!valid} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
