import { ThemedText, type ThemedTextProps } from '@/components/themed-text';
import { MacroTextClass } from '@/constants/macros';
import { cn } from '@/lib/cn';
import { formatAmount, roundMacros, type Macros } from '@/lib/macros';

type Props = {
  macros: Macros;
  grams?: number;
  /** Include the calorie count in the line. Logged rows show calories separately. */
  showKcal?: boolean;
} & ThemedTextProps;

/** "100 g · 150 kcal · P 30 · C 4 · F 2.5" */
export function MacroBits({ macros, grams, showKcal = false, className, ...rest }: Props) {
  const m = roundMacros(macros);
  return (
    <ThemedText
      type="small"
      numberOfLines={1}
      className={cn('text-foreground-secondary', className)}
      {...rest}>
      {grams != null ? `${formatAmount(grams)} g` : ''}
      {grams != null && showKcal ? ' · ' : ''}
      {showKcal ? `${m.kcal} kcal` : ''}
      {grams != null || showKcal ? ' · ' : ''}
      <ThemedText type="small" className={MacroTextClass.protein}>
        P
      </ThemedText>{' '}
      {formatAmount(m.protein)} ·{' '}
      <ThemedText type="small" className={MacroTextClass.carbs}>
        C
      </ThemedText>{' '}
      {formatAmount(m.carbs)} ·{' '}
      <ThemedText type="small" className={MacroTextClass.fat}>
        F
      </ThemedText>{' '}
      {formatAmount(m.fat)}
    </ThemedText>
  );
}
