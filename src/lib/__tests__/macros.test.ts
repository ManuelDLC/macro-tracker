import { describe, expect, it } from '@jest/globals';

import {
  carbsForCalorieGoal,
  energyFromMacros,
  progress,
  roundMacros,
  scaleMacros,
  sumMacros,
} from '../macros';

const oats = { kcal100: 389, protein100: 16.9, carbs100: 66.3, fat100: 6.9 };

describe('scaleMacros', () => {
  it('returns per-100g values for 100 g', () => {
    expect(scaleMacros(oats, 100)).toEqual({ kcal: 389, protein: 16.9, carbs: 66.3, fat: 6.9 });
  });

  it('scales linearly with grams', () => {
    const m = scaleMacros(oats, 40);
    expect(m.kcal).toBeCloseTo(155.6);
    expect(m.protein).toBeCloseTo(6.76);
    expect(m.carbs).toBeCloseTo(26.52);
    expect(m.fat).toBeCloseTo(2.76);
  });

  it.each([0, -50, NaN, Infinity])('returns zeros for invalid amount %p', (grams) => {
    expect(scaleMacros(oats, grams)).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe('sumMacros', () => {
  it('returns zeros for an empty list', () => {
    expect(sumMacros([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('adds each macro and ignores extra fields', () => {
    const total = sumMacros([
      { kcal: 100, protein: 10, carbs: 5, fat: 2, name: 'a' } as never,
      { kcal: 250, protein: 3.5, carbs: 40, fat: 8 },
    ]);
    expect(total).toEqual({ kcal: 350, protein: 13.5, carbs: 45, fat: 10 });
  });
});

describe('roundMacros', () => {
  it('rounds kcal to integers and grams to one decimal', () => {
    expect(roundMacros({ kcal: 155.6, protein: 6.76, carbs: 26.52, fat: 2.74 })).toEqual({
      kcal: 156,
      protein: 6.8,
      carbs: 26.5,
      fat: 2.7,
    });
  });
});

describe('energyFromMacros', () => {
  it('uses 4 kcal/g for protein and carbs and 9 kcal/g for fat', () => {
    expect(energyFromMacros(150, 200, 65)).toBe(1985);
  });
});

describe('carbsForCalorieGoal', () => {
  it('solves for the carbs that make macros match the calorie goal', () => {
    expect(carbsForCalorieGoal(1900, 150, 65)).toBe(179);
  });

  it('never returns negative carbs', () => {
    expect(carbsForCalorieGoal(100, 150, 65)).toBe(0);
  });
});

describe('progress', () => {
  it('clamps to [0, 1]', () => {
    expect(progress(50, 100)).toBe(0.5);
    expect(progress(150, 100)).toBe(1);
    expect(progress(-5, 100)).toBe(0);
  });

  it('is 0 when there is no goal', () => {
    expect(progress(50, 0)).toBe(0);
  });
});
