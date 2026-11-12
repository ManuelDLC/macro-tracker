import { Text, type TextProps } from 'react-native';

import { cn } from '@/lib/cn';

export type ThemedTextProps = TextProps & {
  type?: keyof typeof TYPE_CLASSES;
};

const TYPE_CLASSES = {
  default: 'text-[16px] leading-[24px] font-medium',
  small: 'text-[14px] leading-[20px] font-medium',
  smallBold: 'text-[14px] leading-[20px] font-bold',
  subtitle: 'text-[32px] leading-[44px] font-semibold',
};

export function ThemedText({ className, type = 'default', ...rest }: ThemedTextProps) {
  return <Text className={cn('text-foreground', TYPE_CLASSES[type], className)} {...rest} />;
}
