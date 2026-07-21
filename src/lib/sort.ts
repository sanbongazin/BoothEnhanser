import type { ItemRecord, SortMode } from './types';
import { fisherYatesShuffle } from './rng';

// モジュールスコープで1回だけ生成し、呼び出しごとの再生成コストを避ける
const jaCollator = new Intl.Collator('ja');

function shopNameKey(item: ItemRecord): string {
  return item.yomiOverride.shopName ?? item.shopName;
}

function itemNameKey(item: ItemRecord): string {
  return item.yomiOverride.itemName ?? item.itemName;
}

const comparators: Record<Exclude<SortMode, 'random'>, (a: ItemRecord, b: ItemRecord) => number> = {
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  'registered-new': (a, b) => b.registeredAt.localeCompare(a.registeredAt),
  'registered-old': (a, b) => a.registeredAt.localeCompare(b.registeredAt),
  'updated-new': (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  'updated-old': (a, b) => a.updatedAt.localeCompare(b.updatedAt),
  'shop-name-ja': (a, b) => jaCollator.compare(shopNameKey(a), shopNameKey(b)),
  'item-name-ja': (a, b) => jaCollator.compare(itemNameKey(a), itemNameKey(b)),
};

/** 指定モードで並び替えた新しい配列を返す(元配列は変更しない)。 */
export function sortItems(items: readonly ItemRecord[], mode: SortMode): ItemRecord[] {
  if (mode === 'random') {
    return fisherYatesShuffle(items);
  }
  return items.slice().sort(comparators[mode]);
}
