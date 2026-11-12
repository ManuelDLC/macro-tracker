import { TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { cn } from '@/lib/cn';

type Props = TextInputProps & { label?: string; suffix?: string };

export function TextField({ label, suffix, className, ...rest }: Props) {
  return (
    <View className="gap-1">
      {label ? (
        <ThemedText type="small" className="text-foreground-secondary">
          {label}
        </ThemedText>
      ) : null}
      <View className="flex-row items-center rounded-2xl px-4 gap-2 bg-background-element">
        <TextInput
          placeholderTextColorClassName="accent-foreground-secondary"
          className={cn('flex-1 min-h-11 text-[16px] text-foreground', className)}
          {...rest}
        />
        {suffix ? (
          <ThemedText type="small" className="text-foreground-secondary">
            {suffix}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}
