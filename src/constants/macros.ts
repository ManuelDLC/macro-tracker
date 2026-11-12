import type { Meal } from '@/db/schema';

export const MacroTextClass = {
  kcal: 'text-kcal',
  protein: 'text-protein',
  carbs: 'text-carbs',
  fat: 'text-fat',
} as const;

export const MacroBgClass = {
  kcal: 'bg-kcal',
  protein: 'bg-protein',
  carbs: 'bg-carbs',
  fat: 'bg-fat',
} as const;

export const MacroLabels = {
  kcal: 'Calories',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
} as const;

export const MealLabels: Record<Meal, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};
