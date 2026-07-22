import type { ItemRecord, ItemType } from './types';
import { AVATAR_KEYWORDS, NON_AVATAR_KEYWORDS } from './keywordDictionary';

// 実セッションで確認済み(2026-07-22): wish_list_name_items.json APIのcategory.name.jaに入る
// 実際の値。「3Dキャラクター」がアバター本体、それ以外(衣装・髪型・装飾品・小道具・
// 環境/ワールド・テクスチャ・ツール・その他モデル等)はアバター以外として扱う。
// ここに無い未知のカテゴリはキーワード辞書によるフォールバックへ回る。
export const CATEGORY_TO_ITEM_TYPE: Record<string, ItemType> = {
  '3Dキャラクター': 'avatar',
  '3D衣装': 'non-avatar',
  '3D髪型': 'non-avatar',
  '3D装飾品': 'non-avatar',
  '3D小道具': 'non-avatar',
  '3D環境・ワールド': 'non-avatar',
  '3Dテクスチャ': 'non-avatar',
  '3Dツール・システム': 'non-avatar',
  '3Dモデル（その他）': 'non-avatar',
  ゲーム関連商品: 'non-avatar',
  ソフトウェア: 'non-avatar',
  'ハードウェア・ガジェット': 'non-avatar',
};

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
