import type { ItemRecord } from '../src/lib/types';

export function makeItem(overrides: Partial<ItemRecord> = {}): ItemRecord {
  return {
    itemId: 'item-1',
    itemName: 'アイテム',
    shopName: 'ショップ',
    shopId: 'shop-1',
    url: 'https://booth.pm/ja/items/item-1',
    thumbnailUrl: 'https://booth.pximg.net/example/thumb.jpg',
    price: 1000,
    registeredAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    tags: [],
    avatarTags: [],
    avatarTagsScannedAt: null,
    isAdult: false,
    itemType: 'unknown',
    itemTypeOverride: null,
    affinityScore: null,
    scoredWithProfileVersion: null,
    yomiOverride: {},
    lastPickedAt: null,
    ...overrides,
  };
}
