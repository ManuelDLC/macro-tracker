import { desc, eq, max } from 'drizzle-orm';

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

/** Most recently logged foods, newest first. */
export function recentFoodsQuery(limit = 15) {
  return db
    .select({
      id: foods.id,
      name: foods.name,
      brand: foods.brand,
      kcal100: foods.kcal100,
    })
    .from(logEntries)
    .innerJoin(foods, eq(logEntries.foodId, foods.id))
    .groupBy(foods.id)
    .orderBy(desc(max(logEntries.id)))
    .limit(limit);
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
