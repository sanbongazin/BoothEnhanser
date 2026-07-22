// BOOTHページの解析ロジックを集約するモジュール。
// BOOTH側のDOM構造・JSON-LDのキー名変更はここだけを直せば追従できるようにする。
//
// TODO(verify-against-live-booth): 以下の値はすべて未検証のプレースホルダー。
// ログイン中の実セッションで実ページを確認し、正しいセレクタ/フィールド名に
// 差し替えること。

/** DOM フォールバックで使うCSSセレクタ。BOOTH側のマークアップ変更時はここだけ直す。 */
export const SELECTORS = {
  // 実セッションで確認済み(2026-07-21): 好きリスト(https://accounts.booth.pm/wish_lists)の
  // 商品カードは `.item-card-wrapper` 配下に商品ページへのリンクが複数(サムネイル/タイトル)存在する。
  wishListItemLink: '.item-card-wrapper a[href*="/items/"]',
  price: '.price', // TODO(verify-against-live-booth): 商品詳細ページ側は未確認
  registeredAt: '[data-registered-at]', // TODO(verify-against-live-booth): 商品詳細ページ側は未確認
  category: '.item-category', // TODO(verify-against-live-booth): 商品詳細ページ側は未確認
  adultBadge: '.item-card__badge--r18', // TODO(verify-against-live-booth): 商品詳細ページ側は未確認
  // TODO(verify-against-live-booth): 好きリストのページネーションはリンクのhrefではなく
  // JS駆動のクリックハンドラ(<div>)であり、rel="next"のようなアンカーは存在しないことを確認済み。
  // 実セッションで確認済み(2026-07-22): 好きリストの取得は現在
  // `wish_list_name_items.json?page=N` (lib/wishListApi.ts) 経由で行っており、
  // このDOMフォールバック一式(extractor.ts)はcontent/index.tsから呼ばれていない未使用コード。
  // このセレクタは現状機能しない。
  nextPageLink: '.pagination a[rel="next"]',
} as const;

/** 内部フィールド名 → schema.org Product上の(推定)パス。 */
export const JSONLD_FIELD_MAP = {
  itemName: 'name',
  price: 'offers.price',
  shopName: 'brand.name',
  isAdult: 'isAdult', // TODO(verify-against-live-booth): 標準schema.orgフィールドではない可能性が高い
} as const;

export interface ParsedItem {
  itemId: string;
  itemName: string;
  shopName: string;
  shopId: string;
  price: number;
  registeredAt: string | null;
  updatedAt: string | null;
  tags: string[];
  isAdult: boolean;
  category: string | null;
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function parseJsonLd(doc: Document): Record<string, unknown> | null {
  const script = doc.querySelector('script[type="application/ld+json"]');
  if (!script?.textContent) return null;
  try {
    const parsed: unknown = JSON.parse(script.textContent);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function parseDomFallback(doc: Document): Partial<ParsedItem> {
  const result: Partial<ParsedItem> = {};

  const priceText = doc.querySelector(SELECTORS.price)?.textContent;
  if (priceText) {
    const numeric = Number(priceText.replace(/[^\d]/g, ''));
    if (!Number.isNaN(numeric)) result.price = numeric;
  }

  const registeredAt = doc
    .querySelector(SELECTORS.registeredAt)
    ?.getAttribute('data-registered-at');
  if (registeredAt) result.registeredAt = registeredAt;

  const category = doc.querySelector(SELECTORS.category)?.textContent?.trim();
  if (category) result.category = category;

  result.isAdult = doc.querySelector(SELECTORS.adultBadge) !== null;

  return result;
}

function extractItemIdFromUrl(url: string): string | null {
  // TODO(verify-against-live-booth): 実際の商品ページURL構造(/items/{id} 等)を確認して調整する
  const match = /\/items\/(\d+)/.exec(url);
  return match ? (match[1] ?? null) : null;
}

/** 商品ページのDocumentから1件分のデータを抽出する。判定に必要な情報が無ければnull。 */
export function extractItemFromDocument(doc: Document, url: string): ParsedItem | null {
  const itemId = extractItemIdFromUrl(url);
  if (!itemId) return null;

  const jsonLd = parseJsonLd(doc);
  const domFallback = parseDomFallback(doc);

  const itemName = (jsonLd ? getByPath(jsonLd, JSONLD_FIELD_MAP.itemName) : undefined) as
    string | undefined;
  const shopName = (jsonLd ? getByPath(jsonLd, JSONLD_FIELD_MAP.shopName) : undefined) as
    string | undefined;
  const jsonLdPrice = (jsonLd ? getByPath(jsonLd, JSONLD_FIELD_MAP.price) : undefined) as
    number | string | undefined;

  if (!itemName) return null;

  const price = domFallback.price ?? (jsonLdPrice !== undefined ? Number(jsonLdPrice) : NaN);
  if (Number.isNaN(price)) return null;

  return {
    itemId,
    itemName,
    shopName: shopName ?? '',
    shopId: shopName ?? '', // TODO(verify-against-live-booth): ショップID取得方法を確認
    price,
    registeredAt: domFallback.registeredAt ?? null,
    updatedAt: null, // TODO(verify-against-live-booth)
    tags: [], // TODO(verify-against-live-booth): タグ取得セレクタを確認
    isAdult: domFallback.isAdult ?? false,
    category: domFallback.category ?? null,
  };
}

/**
 * 好きリスト一覧ページから、現在表示されているアイテムのID/URLを抽出する。
 * 1商品につきサムネイル/タイトルの2つのリンクがヒットするため、itemIdで重複除去する。
 */
export function extractWishListEntries(doc: Document): { itemId: string; url: string }[] {
  const links = Array.from(doc.querySelectorAll<HTMLAnchorElement>(SELECTORS.wishListItemLink));
  const seen = new Set<string>();
  const entries: { itemId: string; url: string }[] = [];

  for (const a of links) {
    const url = a.href;
    const itemId = extractItemIdFromUrl(url);
    if (!itemId || seen.has(itemId)) continue;
    seen.add(itemId);
    entries.push({ itemId, url });
  }

  return entries;
}

/** 好きリスト一覧ページの「次へ」リンクURLを返す。最終ページならnull。 */
export function extractNextPageUrl(doc: Document): string | null {
  const next = doc.querySelector<HTMLAnchorElement>(SELECTORS.nextPageLink);
  return next?.href ?? null;
}
