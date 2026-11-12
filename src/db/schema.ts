import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const foods = sqliteTable('foods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  barcode: text('barcode').unique(),
  name: text('name').notNull(),
  brand: text('brand'),
  kcal100: real('kcal_100').notNull(),
  protein100: real('protein_100').notNull(),
  carbs100: real('carbs_100').notNull(),
  fat100: real('fat_100').notNull(),
  servingGrams: real('serving_grams'),
  favorite: integer('favorite', { mode: 'boolean' }).notNull().default(false),
  source: text('source', { enum: ['off', 'custom'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type Meal = (typeof MEALS)[number];

export const logEntries = sqliteTable(
  'log_entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    foodId: integer('food_id')
      .notNull()
      .references(() => foods.id),
    date: text('date').notNull(),  
    meal: text('meal', { enum: MEALS }).notNull(),
    grams: real('grams').notNull(),
    kcal: real('kcal').notNull(),
    protein: real('protein').notNull(),
    carbs: real('carbs').notNull(),
    fat: real('fat').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('log_entries_date_idx').on(t.date)],
);

export const goals = sqliteTable('goals', {
  id: integer('id').primaryKey(),
  kcal: real('kcal').notNull(),
  protein: real('protein').notNull(),
  carbs: real('carbs').notNull(),
  fat: real('fat').notNull(),
});

export type FoodRow = typeof foods.$inferSelect;
export type NewFood = typeof foods.$inferInsert;
export type LogEntryRow = typeof logEntries.$inferSelect;
export type GoalsRow = typeof goals.$inferSelect;
