import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MacroBgClass, MacroLabels } from '@/constants/macros';
import { cn } from '@/lib/cn';
import { progress, type Macros } from '@/lib/macros';

type Props = {
  macro: keyof Macros;
  value: number;
  goal: number;
};

export function MacroBar({ macro, value, goal }: Props) {
  const unit = macro === 'kcal' ? '' : 'g';
  const over = goal > 0 && value > goal;
  const remaining = Math.round(goal - value);

  return (
    <View className="gap-1">
      <View className="flex-row justify-between items-baseline">
        <ThemedText type="smallBold">{MacroLabels[macro]}</ThemedText>
        <ThemedText type="small" className="text-foreground-secondary">
          {Math.round(value)}
          {unit} / {Math.round(goal)}
          {unit}
          {'  '}
          <ThemedText type="small" className={over ? 'text-protein' : undefined}>
            {over ? `${-remaining}${unit} over` : `${remaining}${unit} left`}
          </ThemedText>
        </ThemedText>
      </View>
      <View className="h-2 rounded-full overflow-hidden bg-background-selected">
        <View
          className={cn('h-full rounded-full', MacroBgClass[macro])}
          style={{ width: `${progress(value, goal) * 100}%` }}
        />
      </View>
    </View>
  );
}
