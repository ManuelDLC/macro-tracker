import { Pressable } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { AppIcon } from '@/components/app-icon';
import { cn } from '@/lib/cn';

import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

type Props = {
  ios: SFSymbol;
  android: AndroidSymbol;
  label: string;
  onPress: () => void;
  variant?: 'surface' | 'primary';
  size?: number;
};

export function IconButton({ ios, android, label, onPress, variant = 'surface', size = 40 }: Props) {
  const [foreground] = useCSSVariable(['--color-foreground']) as string[];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      className={cn(
        'items-center justify-center rounded-full active:opacity-70',
        variant === 'primary' ? 'bg-primary' : 'bg-background-selected',
      )}
      style={{ width: size, height: size }}>
      <AppIcon ios={ios} android={android} size={size * 0.48} color={variant === 'primary' ? '#ffffff' : foreground} />
    </Pressable>
  );
}
