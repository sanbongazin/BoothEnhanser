import type { ItemRecord, ItemType } from './types';
import { AVATAR_KEYWORDS, NON_AVATAR_KEYWORDS } from './keywordDictionary';

// TODO(verify-against-live-booth): BOOTHの実際のカテゴリ文字列が未確認のため空。
// 実ページのカテゴリ情報を確認し次第、埋めること。
export const CATEGORY_TO_ITEM_TYPE: Record<string, ItemType> = {};

function includesKeyword(haystack: string, keywords: readonly string[]): boolean {
  const lower = haystack.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
}

export interface ClassifyInput {
  category: string | null;
  tags: string[];
  description?: string;
}

/**
 * カテゴリ情報を一次情報とし、判定できない場合はキーワード辞書によるフォールバックで
 * itemTypeを推定する。itemTypeOverride(手動修正)はここでは考慮しない。
 */
export function inferItemType(input: ClassifyInput): ItemType {
  if (input.category !== null) {
    const mapped = CATEGORY_TO_ITEM_TYPE[input.category];
    if (mapped) return mapped;
  }

  const haystack = [...input.tags, input.description ?? ''].join(' ');
  if (includesKeyword(haystack, AVATAR_KEYWORDS)) return 'avatar';
  if (includesKeyword(haystack, NON_AVATAR_KEYWORDS)) return 'non-avatar';
  return 'unknown';
}

/** itemTypeOverride(手動修正)を優先してitemTypeを解決する。表示・分類はこの関数を必ず経由する。 */
export function resolveItemType(item: Pick<ItemRecord, 'itemType' | 'itemTypeOverride'>): ItemType {
  return item.itemTypeOverride ?? item.itemType;
}
