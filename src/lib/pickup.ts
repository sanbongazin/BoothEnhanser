import type { ItemRecord } from './types';
import { mulberry32, seedFromDateString } from './rng';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PickupOptions {
  count?: number;
  cooldownDays?: number;
  now?: Date;
  /** skipボタン押下時などにseedを揺らすための追加ナンス */
  forceReshuffle?: number;
}

function daysSince(isoDate: string, now: Date): number {
  const diff = now.getTime() - new Date(isoDate).getTime();
  return Math.max(0, diff / DAY_MS);
}

function isInCooldown(item: ItemRecord, now: Date, cooldownDays: number): boolean {
  if (!item.lastPickedAt) return false;
  return daysSince(item.lastPickedAt, now) < cooldownDays;
}

/**
 * 「今日のピックアップ」対象を選ぶ。同日中は同じ結果を返す(mulberry32を日付でseed)。
 * 登録から時間が経っているアイテムほど対数的に出現しやすい重み付き抽選(非復元抽出)。
 */
export function selectPickupItems(items: readonly ItemRecord[], options: PickupOptions = {}): ItemRecord[] {
  const { count = 3, cooldownDays = 7, now = new Date(), forceReshuffle } = options;

  if (items.length === 0) return [];

  let pool = items.filter((item) => !isInCooldown(item, now, cooldownDays));
  // クールダウンで対象がcount未満になる場合は、出現できないより緩和を優先する
  if (pool.length < count) {
    pool = items.slice();
  }

  const dateSeed = seedFromDateString(now.toISOString().slice(0, 10));
  const seed = forceReshuffle !== undefined ? dateSeed ^ forceReshuffle : dateSeed;
  const rng = mulberry32(seed);

  const weighted = pool.map((item) => ({
    item,
    weight: Math.log(1 + daysSince(item.registeredAt, now)) + 0.0001,
  }));

  const picked: ItemRecord[] = [];
  const remaining = weighted.slice();
  const n = Math.min(count, remaining.length);

  for (let i = 0; i < n; i++) {
    const total = remaining.reduce((sum, w) => sum + w.weight, 0);
    let r = rng() * total;
    let index = 0;
    for (; index < remaining.length; index++) {
      const current = remaining[index];
      if (current === undefined) break;
      r -= current.weight;
      if (r <= 0) break;
    }
    const boundedIndex = Math.min(index, remaining.length - 1);
    const [selected] = remaining.splice(boundedIndex, 1);
    if (selected) picked.push(selected.item);
  }

  return picked;
}
