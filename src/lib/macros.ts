export type Macros = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Per100g = {
  kcal100: number;
  protein100: number;
  carbs100: number;
  fat100: number;
};

export const ZERO_MACROS: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

export function scaleMacros(food: Per100g, grams: number): Macros {
  const factor = Number.isFinite(grams) && grams > 0 ? grams / 100 : 0;
  return {
    kcal: food.kcal100 * factor,
    protein: food.protein100 * factor,
    carbs: food.carbs100 * factor,
    fat: food.fat100 * factor,
  };
}

export function sumMacros(items: readonly Macros[]): Macros {
  return items.reduce<Macros>(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { ...ZERO_MACROS },
  );
}

export function roundMacros(m: Macros): Macros {
  return {
    kcal: Math.round(m.kcal),
    protein: round1(m.protein),
    carbs: round1(m.carbs),
    fat: round1(m.fat),
  };
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Fraction of goal reached, clamped to [0, 1] for progress bars. */
export function progress(value: number, goal: number): number {
  if (!(goal > 0)) return 0;
  return Math.min(1, Math.max(0, value / goal));
}
