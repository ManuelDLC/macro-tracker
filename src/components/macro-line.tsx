import { ThemedText, type ThemedTextProps } from '@/components/themed-text';
import { MacroTextClass } from '@/constants/macros';
import { cn } from '@/lib/cn';
import { roundMacros, type Macros } from '@/lib/macros';

/** Compact "120 kcal · P 10g · C 5g · F 3g" line. */
export function MacroLine({ macros, className, ...rest }: { macros: Macros } & ThemedTextProps) {
  const m = roundMacros(macros);
  return (
    <ThemedText type="small" className={cn('text-foreground-secondary', className)} {...rest}>
      {m.kcal} kcal · <ThemedText type="small" className={MacroTextClass.protein}>P</ThemedText>{' '}
      {m.protein}g · <ThemedText type="small" className={MacroTextClass.carbs}>C</ThemedText>{' '}
      {m.carbs}g · <ThemedText type="small" className={MacroTextClass.fat}>F</ThemedText>{' '}
      {m.fat}g
    </ThemedText>
  );
}
