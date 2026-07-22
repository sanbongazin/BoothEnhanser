export type ItemType = 'avatar' | 'non-avatar' | 'unknown';

export interface YomiOverride {
  shopName?: string;
  itemName?: string;
}

export interface ItemRecord {
  itemId: string;
  itemName: string;
  shopName: string;
  shopId: string;
  /** 商品ページの絶対URL */
  url: string;
  /** カード表示用サムネイル画像URL */
  thumbnailUrl: string;
  price: number;
  /** ISO 8601 */
  registeredAt: string;
  /** ISO 8601 */
  updatedAt: string;
  tags: string[];
  /** 対応アバター名候補(商品詳細ページの説明文/バリエーション名からベストエフォートで抽出) */
  avatarTags: string[];
  /** 商品詳細ページを対応アバター抽出のために取得済みか。ISO 8601、未取得ならnull */
  avatarTagsScannedAt: string | null;
  isAdult: boolean;
  itemType: ItemType;
  itemTypeOverride: ItemType | null;
  affinityScore: number | null;
  scoredWithProfileVersion: number | null;
  yomiOverride: YomiOverride;
  /** ISO 8601, or null if never shown by the pickup widget */
  lastPickedAt: string | null;
}

export interface UserProfileRecord {
  id: 'main';
  tagWeights: Record<string, number>;
  lastPurchaseIdProcessed: string;
  lastFavoriteIdProcessed: string;
  profileVersion: number;
  updatedAt: string;
}

export type SortMode =
  | 'price-asc'
  | 'price-desc'
  | 'registered-new'
  | 'registered-old'
  | 'updated-new'
  | 'updated-old'
  | 'shop-name-ja'
  | 'item-name-ja'
  | 'random';

/**
 * アバターにはR-18分岐がないため、タブ構成はこの3種+アバター以外のサブタブで表現する。
 * 'all'は絞り込みなしで全件を自前グリッドに表示する通常のタブ(BOOTHネイティブの
 * フォルダタブ「すべて/未分類/…」・「スキの管理」とは独立に、常にBOOTHネイティブ側は
 * 操作可能なまま残る)。
 */
export type TabKey = 'all' | 'avatar' | 'non-avatar-all-ages' | 'non-avatar-adult' | 'other';

export type ViewMode = 'card' | 'list';
