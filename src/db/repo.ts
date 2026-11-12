import { desc, eq } from 'drizzle-orm';

import { scaleMacros, sumMacros, type Macros } from '@/lib/macros';

import { db } from './client';
import { foods, goals, logEntries, type GoalsRow, type Meal, type NewFood } from './schema';

export const DEFAULT_GOALS: Omit<GoalsRow, 'id'> = {
  kcal: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

const GOALS_ROW_ID = 1;

// ---------- Foods ----------

export async function getFoodById(id: number) {
  return db.query.foods.findFirst({ where: eq(foods.id, id) });
}

export async function getFoodByBarcode(barcode: string) {
  return db.query.foods.findFirst({ where: eq(foods.barcode, barcode) });
}

/** Inserts a food, or refreshes the existing row with the same barcode. Returns the row id. */
export async function upsertFood(food: NewFood): Promise<number> {
  const { id: _ignored, createdAt: _createdAt, ...values } = food;
  if (!values.barcode) {
    const [row] = await db.insert(foods).values(values).returning({ id: foods.id });
    return row.id;
  }
  const [row] = await db
    .insert(foods)
    .values(values)
    .onConflictDoUpdate({
      target: foods.barcode,
      set: {
        name: values.name,
        brand: values.brand,
        kcal100: values.kcal100,
        protein100: values.protein100,
        carbs100: values.carbs100,
        fat100: values.fat100,
        servingGrams: values.servingGrams,
        source: values.source,
      },
    })
    .returning({ id: foods.id });
  return row.id;
}

const foodListColumns = {
  id: foods.id,
  name: foods.name,
  brand: foods.brand,
  kcal100: foods.kcal100,
  protein100: foods.protein100,
  carbs100: foods.carbs100,
  fat100: foods.fat100,
  servingGrams: foods.servingGrams,
  favorite: foods.favorite,
};

/** Newest log entries. Callers keep the first row per food. */
export function recentFoodsQuery(limit = 40) {
  return db
    .select({
      ...foodListColumns,
      grams: logEntries.grams,
      kcal: logEntries.kcal,
      protein: logEntries.protein,
      carbs: logEntries.carbs,
      fat: logEntries.fat,
    })
    .from(logEntries)
    .innerJoin(foods, eq(logEntries.foodId, foods.id))
    .orderBy(desc(logEntries.id))
    .limit(limit);
}

export function myFoodsQuery(limit = 50) {
  return db
    .select(foodListColumns)
    .from(foods)
    .where(eq(foods.source, 'custom'))
    .orderBy(desc(foods.id))
    .limit(limit);
}

export function favoriteFoodsQuery(limit = 50) {
  return db
    .select(foodListColumns)
    .from(foods)
    .where(eq(foods.favorite, true))
    .orderBy(desc(foods.id))
    .limit(limit);
}

export async function setFoodFavorite(id: number, favorite: boolean) {
  await db.update(foods).set({ favorite }).where(eq(foods.id, id));
}

// ---------- Log entries ----------

export async function addLogEntry(input: {
  foodId: number;
  date: string;
  meal: Meal;
  grams: number;
}) {
  const food = await getFoodById(input.foodId);
  if (!food) throw new Error(`Food ${input.foodId} not found`);
  const macros = scaleMacros(food, input.grams);
  await db.insert(logEntries).values({ ...input, ...macros });
}

/** Rescales the entry's stored macro snapshot to the new amount. */
export async function updateLogEntryGrams(id: number, grams: number) {
  const entry = await db.query.logEntries.findFirst({ where: eq(logEntries.id, id) });
  if (!entry || !(grams > 0) || !(entry.grams > 0)) return;
  const ratio = grams / entry.grams;
  await db
    .update(logEntries)
    .set({
      grams,
      kcal: entry.kcal * ratio,
      protein: entry.protein * ratio,
      carbs: entry.carbs * ratio,
      fat: entry.fat * ratio,
    })
    .where(eq(logEntries.id, id));
}

export async function deleteLogEntry(id: number) {
  await db.delete(logEntries).where(eq(logEntries.id, id));
}

export function dayEntriesQuery(date: string) {
  return db
    .select({
      id: logEntries.id,
      foodId: logEntries.foodId,
      meal: logEntries.meal,
      grams: logEntries.grams,
      kcal: logEntries.kcal,
      protein: logEntries.protein,
      carbs: logEntries.carbs,
      fat: logEntries.fat,
      name: foods.name,
      brand: foods.brand,
    })
    .from(logEntries)
    .innerJoin(foods, eq(logEntries.foodId, foods.id))
    .where(eq(logEntries.date, date))
    .orderBy(logEntries.createdAt, logEntries.id);
}

export type DayEntry = Awaited<ReturnType<typeof dayEntriesQuery>>[number];

export async function getDayEntries(date: string) {
  return dayEntriesQuery(date);
}

export async function getDayTotals(date: string): Promise<Macros> {
  return sumMacros(await getDayEntries(date));
}

// ---------- Goals ----------

export function goalsQuery() {
  return db.select().from(goals).where(eq(goals.id, GOALS_ROW_ID));
}

export async function getGoals(): Promise<Omit<GoalsRow, 'id'>> {
  const [row] = await goalsQuery();
  if (!row) return DEFAULT_GOALS;
  const { id: _id, ...rest } = row;
  return rest;
}

export async function setGoals(values: Omit<GoalsRow, 'id'>) {
  await db
    .insert(goals)
    .values({ id: GOALS_ROW_ID, ...values })
    .onConflictDoUpdate({ target: goals.id, set: values });
}
