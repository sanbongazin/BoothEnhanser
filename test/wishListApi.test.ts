import { describe, expect, it } from 'vitest';
import { parseWishListApiResponse, wishListPageUrl } from '../src/lib/wishListApi';

function makeRawResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    items: [
      {
        id: 1234567,
        name: 'テストアバター',
        price: '¥ 3,000~',
        is_adult: false,
        category: { name: { ja: '3Dキャラクター', en: '3D Characters' } },
        shop: { name: 'テストショップ', url: 'https://testshop.booth.pm/' },
        url: 'https://booth.pm/ja/items/1234567',
        thumbnail_image_urls: ['https://booth.pximg.net/example/thumb.jpg'],
        tracking_data: { product_price: 3000 },
      },
    ],
    pagination: {
      current_page: 1,
      next_page: 2,
      total_pages: 3,
      total_count: 42,
    },
    ...overrides,
  };
}

describe('wishListPageUrl', () => {
  it('builds a page query URL', () => {
    expect(wishListPageUrl(3)).toBe('https://accounts.booth.pm/wish_list_name_items.json?page=3');
  });
});

describe('parseWishListApiResponse', () => {
  it('parses items and pagination from a well-formed response', () => {
    const result = parseWishListApiResponse(makeRawResponse());

    expect(result.items).toEqual([
      {
        itemId: '1234567',
        itemName: 'テストアバター',
        shopName: 'テストショップ',
        shopId: 'testshop',
        price: 3000,
        isAdult: false,
        category: '3Dキャラクター',
        url: 'https://booth.pm/ja/items/1234567',
        thumbnailUrl: 'https://booth.pximg.net/example/thumb.jpg',
      },
    ]);
    expect(result.pagination).toEqual({
      currentPage: 1,
      nextPage: 2,
      totalPages: 3,
      totalCount: 42,
    });
  });

  it('falls back to parsing the price string when tracking_data.product_price is missing', () => {
    const raw = makeRawResponse();
    delete (raw.items[0] as { tracking_data?: unknown }).tracking_data;

    const result = parseWishListApiResponse(raw);
    expect(result.items[0]?.price).toBe(3000);
  });

  it('returns null category and empty shop fields when absent', () => {
    const raw = makeRawResponse({
      items: [
        {
          id: 1234567,
          name: 'テストアバター',
          price: '¥ 3,000~',
          is_adult: false,
          category: null,
          shop: null,
          url: 'https://booth.pm/ja/items/1234567',
        },
      ],
    });

    const result = parseWishListApiResponse(raw);
    expect(result.items[0]?.category).toBeNull();
    expect(result.items[0]?.shopName).toBe('');
    expect(result.items[0]?.shopId).toBe('');
  });

  it('throws when the response shape is unexpected', () => {
    expect(() => parseWishListApiResponse({ foo: 'bar' })).toThrow();
  });
});
