import { afterEach, describe, expect, it, jest } from '@jest/globals';

import {
  getProductByBarcode,
  mapOffProduct,
  mapSearchResults,
  OffNetworkError,
  searchProducts,
} from '../openFoodFacts';

const nutella = {
  code: '3017624010701',
  product_name: 'Nutella',
  brands: 'Ferrero, Nutella',
  serving_quantity: 15,
  nutriments: {
    'energy-kcal_100g': 539,
    proteins_100g: 6.3,
    carbohydrates_100g: 57.5,
    fat_100g: 30.9,
  },
};

describe('mapOffProduct', () => {
  it('maps a complete product', () => {
    expect(mapOffProduct(nutella)).toEqual({
      barcode: '3017624010701',
      name: 'Nutella',
      brand: 'Ferrero',
      kcal100: 539,
      protein100: 6.3,
      carbs100: 57.5,
      fat100: 30.9,
      servingGrams: 15,
      source: 'off',
    });
  });

  it('takes the first brand from the array format used by the search API', () => {
    expect(mapOffProduct({ ...nutella, brands: ['Fairtrade', 'Other'] })?.brand).toBe('Fairtrade');
  });

  it('converts kJ to kcal when kcal is missing', () => {
    const food = mapOffProduct({ ...nutella, nutriments: { 'energy-kj_100g': 418.4 } });
    expect(food?.kcal100).toBeCloseTo(100);
  });

  it('parses numeric strings and defaults missing macros to 0', () => {
    const food = mapOffProduct({
      code: '123',
      product_name: 'Rice cake',
      serving_quantity: '9',
      nutriments: { 'energy-kcal_100g': '387' },
    });
    expect(food).toMatchObject({
      kcal100: 387,
      protein100: 0,
      carbs100: 0,
      fat100: 0,
      servingGrams: 9,
      brand: null,
    });
  });

  it('falls back to alternate name fields', () => {
    expect(mapOffProduct({ ...nutella, product_name: '', product_name_en: 'Hazelnut spread' })?.name).toBe(
      'Hazelnut spread',
    );
  });

  it.each([
    ['no calories', { ...nutella, nutriments: { proteins_100g: 5 } }],
    ['no name', { ...nutella, product_name: '  ' }],
    ['no barcode', { ...nutella, code: undefined }],
    ['negative calories', { ...nutella, nutriments: { 'energy-kcal_100g': -1 } }],
  ])('returns null when the product has %s', (_label, product) => {
    expect(mapOffProduct(product)).toBeNull();
  });

  it('ignores a zero serving size', () => {
    expect(mapOffProduct({ ...nutella, serving_quantity: 0 })?.servingGrams).toBeNull();
  });
});

describe('mapSearchResults', () => {
  it('drops products without nutrition data and duplicate barcodes', () => {
    const results = mapSearchResults([
      nutella,
      { code: '1', product_name: 'Fresh Banana', brands: ['Fresh Banana'] },
      { ...nutella, product_name: 'Nutella duplicate' },
    ]);
    expect(results.map((r) => r.name)).toEqual(['Nutella']);
  });
});

describe('network calls', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  function mockFetch(...responses: (Partial<Response> | Error)[]) {
    const fn = jest.fn<(url: string, init: { headers: Record<string, string> }) => Promise<unknown>>();
    for (const r of responses) {
      if (r instanceof Error) fn.mockRejectedValueOnce(r);
      else fn.mockResolvedValueOnce({ ok: true, status: 200, ...r });
    }
    globalThis.fetch = fn as unknown as typeof fetch;
    return fn;
  }

  it('getProductByBarcode returns the mapped product', async () => {
    const fetchMock = mockFetch({ json: async () => ({ status: 1, product: nutella }) });
    await expect(getProductByBarcode('3017624010701')).resolves.toMatchObject({ name: 'Nutella' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v2/product/3017624010701.json');
    expect(init.headers['User-Agent']).toMatch(/MacroTracker/);
  });

  it('getProductByBarcode returns null for unknown products', async () => {
    mockFetch({ json: async () => ({ status: 0 }) });
    await expect(getProductByBarcode('000')).resolves.toBeNull();
  });

  it('getProductByBarcode throws OffNetworkError when offline', async () => {
    mockFetch(new TypeError('Network request failed'));
    await expect(getProductByBarcode('123')).rejects.toBeInstanceOf(OffNetworkError);
  });

  it('searchProducts falls back to the legacy endpoint when search fails', async () => {
    const fetchMock = mockFetch(
      { ok: false, status: 503 },
      { json: async () => ({ products: [nutella] }) },
    );
    await expect(searchProducts('nutella')).resolves.toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toContain('search.openfoodfacts.org');
    expect(fetchMock.mock.calls[1][0]).toContain('cgi/search.pl');
  });
});
