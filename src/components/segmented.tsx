import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { cn } from '@/lib/cn';

type Props<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** `accent` paints the selected segment with the primary color. */
  variant?: 'default' | 'accent';
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  variant = 'default',
}: Props<T>) {
  return (
    <View className="flex-row rounded-full p-1 bg-background-element">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(opt.value)}
            className={cn(
              'flex-1 items-center py-2 rounded-full',
              selected && (variant === 'accent' ? 'bg-primary' : 'bg-background-selected'),
            )}>
            <ThemedText
              type={selected ? 'smallBold' : 'small'}
              className={cn(
                selected
                  ? variant === 'accent'
                    ? 'text-white'
                    : undefined
                  : 'text-foreground-secondary',
              )}>
              {opt.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
