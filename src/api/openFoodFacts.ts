import type { NewFood } from '@/db/schema';

const USER_AGENT = 'MacroTracker/1.0 (Expo app; contact: dev@macrotracker.local)';
const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product';
const SEARCH_URL = 'https://search.openfoodfacts.org/search';
const LEGACY_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const FIELDS = [
  'code',
  'product_name',
  'product_name_en',
  'generic_name',
  'brands',
  'nutriments',
  'serving_quantity',
].join(',');
const KJ_PER_KCAL = 4.184;

/** A food from Open Food Facts that hasn't been saved locally yet. */
export type OffFood = NewFood & { barcode: string; source: 'off' };

export type OffProduct = {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  brands?: string | string[];
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
};

export class OffNetworkError extends Error {}

function num(value: unknown): number | undefined {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : undefined;
}

function firstBrand(brands: OffProduct['brands']): string | null {
  const raw = Array.isArray(brands) ? brands[0] : brands?.split(',')[0];
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

/** Converts an OFF product to a Food, or null when it lacks a name, barcode, or calories. */
export function mapOffProduct(p: OffProduct): OffFood | null {
  const name = (p.product_name || p.product_name_en || p.generic_name || '').trim();
  const code = p.code?.trim();
  const n = p.nutriments ?? {};

  const kj = num(n['energy-kj_100g']) ?? num(n['energy_100g']);
  const kcal = num(n['energy-kcal_100g']) ?? (kj !== undefined ? kj / KJ_PER_KCAL : undefined);

  if (!name || !code || kcal === undefined) return null;

  const serving = num(p.serving_quantity);

  return {
    barcode: code,
    name,
    brand: firstBrand(p.brands),
    kcal100: kcal,
    protein100: num(n['proteins_100g']) ?? 0,
    carbs100: num(n['carbohydrates_100g']) ?? 0,
    fat100: num(n['fat_100g']) ?? 0,
    servingGrams: serving && serving > 0 ? serving : null,
    source: 'off',
  };
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e;
    throw new OffNetworkError('Could not reach Open Food Facts. Check your connection.');
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new OffNetworkError(`Open Food Facts returned ${res.status}`);
  try {
    return await res.json();
  } catch {
    throw new OffNetworkError('Open Food Facts returned an unexpected response.');
  }
}

/** Returns the product for a barcode, or null if OFF doesn't know it or it has no calorie data. */
export async function getProductByBarcode(
  barcode: string,
  signal?: AbortSignal,
): Promise<OffFood | null> {
  const url = `${PRODUCT_URL}/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`;
  const data = (await getJson(url, signal)) as { status?: number; product?: OffProduct } | null;
  if (!data || data.status !== 1 || !data.product) return null;
  return mapOffProduct({ ...data.product, code: data.product.code ?? barcode });
}

export function mapSearchResults(products: readonly OffProduct[]): OffFood[] {
  const seen = new Set<string>();
  const out: OffFood[] = [];
  for (const p of products) {
    const food = mapOffProduct(p);
    if (food && !seen.has(food.barcode)) {
      seen.add(food.barcode);
      out.push(food);
    }
  }
  return out;
}

export async function searchProducts(query: string, signal?: AbortSignal): Promise<OffFood[]> {
  const q = encodeURIComponent(query.trim());
  try {
    const data = (await getJson(
      `${SEARCH_URL}?q=${q}&page_size=50&fields=${FIELDS}`,
      signal,
    )) as { hits?: OffProduct[] } | null;
    return mapSearchResults(data?.hits ?? []);
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e;
    const data = (await getJson(
      `${LEGACY_SEARCH_URL}?search_terms=${q}&json=1&page_size=50&fields=${FIELDS}`,
      signal,
    )) as { products?: OffProduct[] } | null;
    return mapSearchResults(data?.products ?? []);
  }
}
