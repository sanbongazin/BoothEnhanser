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
  price: number;
  /** ISO 8601 */
  registeredAt: string;
  /** ISO 8601 */
  updatedAt: string;
  tags: string[];
  avatarTags: string[];
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

/** アバターにはR-18分岐がないため、タブ構成はこの3種+アバター以外のサブタブで表現する */
export type TabKey = 'avatar' | 'non-avatar-all-ages' | 'non-avatar-adult' | 'other';
