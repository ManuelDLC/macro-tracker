import type { Meal } from '@/db/schema';

export function defaultMealForTime(d: Date = new Date()): Meal {
  const minutes = d.getHours() * 60 + d.getMinutes();
  if (minutes < 10 * 60 + 30) return 'breakfast';
  if (minutes < 15 * 60) return 'lunch';
  if (minutes < 21 * 60) return 'dinner';
  return 'snack';
}

/** Parses user-typed numbers, accepting comma decimals. Returns NaN for empty/invalid input. */
export function parseAmount(text: string): number {
  const cleaned = text.replace(',', '.').trim();
  if (!cleaned) return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}
