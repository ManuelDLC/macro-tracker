import { describe, expect, it } from '@jest/globals';

import { addDays, toDateKey } from '../dates';
import { defaultMealForTime, parseAmount } from '../meals';

describe('dates', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('defaultMealForTime', () => {
  it.each([
    [7, 0, 'breakfast'],
    [10, 29, 'breakfast'],
    [12, 30, 'lunch'],
    [18, 0, 'dinner'],
    [22, 0, 'snack'],
  ])('%i:%i -> %s', (h, m, meal) => {
    expect(defaultMealForTime(new Date(2026, 0, 1, h, m))).toBe(meal);
  });
});

describe('parseAmount', () => {
  it('accepts comma decimals', () => {
    expect(parseAmount('1,5')).toBe(1.5);
  });

  it('returns NaN for empty or invalid input', () => {
    expect(parseAmount('')).toBeNaN();
    expect(parseAmount('abc')).toBeNaN();
  });
});
