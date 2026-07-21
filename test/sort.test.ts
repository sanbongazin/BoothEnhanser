import { describe, expect, it } from 'vitest';
import { sortItems } from '../src/lib/sort';
import { makeItem } from './fixtures';

describe('sortItems', () => {
  it('sorts by price ascending/descending', () => {
    const items = [makeItem({ itemId: 'a', price: 300 }), makeItem({ itemId: 'b', price: 100 })];
    expect(sortItems(items, 'price-asc').map((i) => i.itemId)).toEqual(['b', 'a']);
    expect(sortItems(items, 'price-desc').map((i) => i.itemId)).toEqual(['a', 'b']);
  });

  it('sorts by registeredAt new/old', () => {
    const items = [
      makeItem({ itemId: 'old', registeredAt: '2020-01-01T00:00:00.000Z' }),
      makeItem({ itemId: 'new', registeredAt: '2026-01-01T00:00:00.000Z' }),
    ];
    expect(sortItems(items, 'registered-new').map((i) => i.itemId)).toEqual(['new', 'old']);
    expect(sortItems(items, 'registered-old').map((i) => i.itemId)).toEqual(['old', 'new']);
  });

  it('sorts by updatedAt new/old', () => {
    const items = [
      makeItem({ itemId: 'old', updatedAt: '2020-01-01T00:00:00.000Z' }),
      makeItem({ itemId: 'new', updatedAt: '2026-01-01T00:00:00.000Z' }),
    ];
    expect(sortItems(items, 'updated-new').map((i) => i.itemId)).toEqual(['new', 'old']);
    expect(sortItems(items, 'updated-old').map((i) => i.itemId)).toEqual(['old', 'new']);
  });

  it('sorts shop name in gojuon order, preferring yomiOverride', () => {
    const items = [
      makeItem({ itemId: 'a', shopName: 'わたなべ工房' }),
      makeItem({ itemId: 'b', shopName: 'あべ商店' }),
      // 表記上は「ん」始まりだが読みオーバーライドで「あ」始まりにする
      makeItem({ itemId: 'c', shopName: 'んぐ工房', yomiOverride: { shopName: 'あんぐ工房' } }),
    ];
    const sorted = sortItems(items, 'shop-name-ja').map((i) => i.itemId);
    expect(sorted[0]).toBe('b');
  });

  it('sorts item name in gojuon order', () => {
    const items = [makeItem({ itemId: 'a', itemName: 'ゆき' }), makeItem({ itemId: 'b', itemName: 'あさ' })];
    expect(sortItems(items, 'item-name-ja').map((i) => i.itemId)).toEqual(['b', 'a']);
  });

  it('random mode returns a permutation without mutating input', () => {
    const items = [makeItem({ itemId: 'a' }), makeItem({ itemId: 'b' }), makeItem({ itemId: 'c' })];
    const before = [...items];
    const shuffled = sortItems(items, 'random');
    expect(shuffled.length).toBe(3);
    expect(items).toEqual(before);
    expect([...shuffled].map((i) => i.itemId).sort()).toEqual(['a', 'b', 'c']);
  });
});
