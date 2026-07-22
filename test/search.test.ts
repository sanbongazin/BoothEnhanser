import { describe, expect, it } from 'vitest';
import { filterBySearchQuery } from '../src/lib/search';
import { makeItem } from './fixtures';

describe('filterBySearchQuery', () => {
  it('クエリが空なら全件返す', () => {
    const items = [makeItem({ itemId: 'a' }), makeItem({ itemId: 'b' })];
    expect(filterBySearchQuery(items, '')).toEqual(items);
    expect(filterBySearchQuery(items, '   ')).toEqual(items);
  });

  it('商品名の部分一致で絞り込む', () => {
    const items = [
      makeItem({ itemId: 'a', itemName: 'マヌカ用ワンピース' }),
      makeItem({ itemId: 'b', itemName: '森羅用ドレス' }),
    ];
    expect(filterBySearchQuery(items, 'マヌカ')).toEqual([items[0]]);
  });

  it('ショップ名の部分一致で絞り込む', () => {
    const items = [
      makeItem({ itemId: 'a', shopName: 'Levy_shop' }),
      makeItem({ itemId: 'b', shopName: 'ALICE' }),
    ];
    expect(filterBySearchQuery(items, 'levy')).toEqual([items[0]]);
  });

  it('対応アバタータグの部分一致で絞り込む', () => {
    const items = [
      makeItem({ itemId: 'a', avatarTags: ['マヌカ', 'しなの'] }),
      makeItem({ itemId: 'b', avatarTags: ['森羅'] }),
    ];
    expect(filterBySearchQuery(items, 'しなの')).toEqual([items[0]]);
  });

  it('大文字小文字を区別しない', () => {
    const items = [makeItem({ itemId: 'a', itemName: 'Manuka Dress' })];
    expect(filterBySearchQuery(items, 'MANUKA')).toEqual(items);
  });

  it('一致する商品が無ければ空配列を返す', () => {
    const items = [makeItem({ itemId: 'a', itemName: 'マヌカ用ワンピース' })];
    expect(filterBySearchQuery(items, '存在しないキーワード')).toEqual([]);
  });
});
