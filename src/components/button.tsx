import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { cn } from '@/lib/cn';

type Props = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
};

const VARIANT_CLASSES = {
  primary: { container: 'bg-primary', text: 'text-white', spinner: 'accent-white' },
  secondary: {
    container: 'bg-background-element',
    text: 'text-foreground',
    spinner: 'accent-foreground',
  },
  danger: { container: 'bg-danger', text: 'text-white', spinner: 'accent-white' },
};

export function Button({ title, variant = 'primary', loading, disabled, className, ...rest }: Props) {
  const classes = VARIANT_CLASSES[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      className={cn(
        'min-h-12 px-4 rounded-full items-center justify-center active:opacity-80 disabled:opacity-50',
        classes.container,
        className,
      )}
      {...rest}>
      {loading ? (
        <ActivityIndicator colorClassName={classes.spinner} />
      ) : (
        <ThemedText type="smallBold" className={classes.text}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}
