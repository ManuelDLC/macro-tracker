import { getProductByBarcode } from '@/api/openFoodFacts';
import { getFoodByBarcode, upsertFood } from '@/db/repo';

export type BarcodeLookupResult =
  | { status: 'found'; foodId: number }
  | { status: 'not-found'; barcode: string };

/** Looks up a barcode in the local cache first, then Open Food Facts (saving any hit locally). */
export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  const cached = await getFoodByBarcode(barcode);
  if (cached) return { status: 'found', foodId: cached.id };

  const product = await getProductByBarcode(barcode);
  if (!product) return { status: 'not-found', barcode };

  return { status: 'found', foodId: await upsertFood(product) };
}
