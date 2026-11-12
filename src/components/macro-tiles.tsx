import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MacroLabels, MacroTextClass } from '@/constants/macros';
import { cn } from '@/lib/cn';
import { roundMacros, type Macros } from '@/lib/macros';

const KEYS = ['kcal', 'protein', 'carbs', 'fat'] as const;

export function MacroTiles({ macros }: { macros: Macros }) {
  const m = roundMacros(macros);
  return (
    <View className="flex-row gap-2">
      {KEYS.map((k) => (
        <View key={k} className="flex-1 items-center py-4 rounded-2xl gap-0.5 bg-background-element">
          <ThemedText
            type="smallBold"
            className={cn('text-[20px] leading-[26px]', MacroTextClass[k])}>
            {m[k]}
            {k === 'kcal' ? '' : 'g'}
          </ThemedText>
          <ThemedText type="small" className="text-foreground-secondary">
            {MacroLabels[k]}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}
