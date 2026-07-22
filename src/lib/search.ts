import type { ItemRecord } from './types';

/**
 * 商品名・ショップ名・対応アバタータグ(avatarCompat.tsの抽出結果)を対象に、
 * 大文字小文字を区別しない部分一致で絞り込む。クエリが空/空白のみの場合は絞り込まない。
 */
export function filterBySearchQuery(items: readonly ItemRecord[], query: string): ItemRecord[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items.slice();

  return items.filter((item) => {
    if (item.itemName.toLowerCase().includes(needle)) return true;
    if (item.shopName.toLowerCase().includes(needle)) return true;
    return item.avatarTags.some((tag) => tag.toLowerCase().includes(needle));
  });
}
