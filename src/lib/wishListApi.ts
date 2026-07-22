// accounts.booth.pm の好きリストJSON APIを解析するモジュール。
// 実セッションで確認済み(2026-07-22): 好きリストページ(https://accounts.booth.pm/wish_lists)は
// 表示時に `wish_list_name_items.json?page=N` をXHRで呼び、全フォルダ横断の一覧を
// {items: [...], pagination: {current_page, prev_page, next_page, limit_value, total_pages,
// total_count}} という形で返す。特別なリクエストヘッダーは不要(素のfetch+credentials:'include'
// で同じ形状が返ることを確認済み)。似た名前の `wish_lists.json` は別物で、パラメータなしだと
// {item_ids: [], wishlists_counts: {}} という無関係の形状を返すため使わないこと。
// 実データ(112件)で items[].shop / items[].category / items[].tracking_data が
// 常に存在することを確認済み。
export const WISH_LIST_ITEMS_JSON_URL = 'https://accounts.booth.pm/wish_list_name_items.json';

export function wishListPageUrl(page: number): string {
  return `${WISH_LIST_ITEMS_JSON_URL}?page=${page}`;
}

export interface WishListApiItem {
  itemId: string;
  itemName: string;
  shopName: string;
  shopId: string;
  price: number;
  isAdult: boolean;
  category: string | null;
  url: string;
  thumbnailUrl: string;
}

export interface WishListApiPagination {
  currentPage: number;
  nextPage: number | null;
  totalPages: number;
  totalCount: number;
}

export interface WishListApiPage {
  items: WishListApiItem[];
  pagination: WishListApiPagination;
}

interface RawWishListItem {
  id: number;
  name: string;
  price: string;
  is_adult: boolean;
  category: { name?: { ja?: string } } | null;
  shop: { name?: string; url?: string } | null;
  url: string;
  thumbnail_image_urls?: string[];
  tracking_data?: { product_price?: number };
}

interface RawWishListResponse {
  items: RawWishListItem[];
  pagination: {
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_count: number;
  };
}

/** "https://{shopId}.booth.pm/..." からサブドメイン(ショップID)を取り出す。 */
function extractShopIdFromUrl(shopUrl: string): string {
  const match = /^https?:\/\/([^./]+)\.booth\.pm\//.exec(shopUrl);
  return match ? (match[1] ?? '') : '';
}

/** tracking_data.product_priceが数値で入っていればそれを優先し、無ければ表示文字列("¥ 500~"等)から抽出する。 */
function parsePrice(raw: RawWishListItem): number {
  if (typeof raw.tracking_data?.product_price === 'number') {
    return raw.tracking_data.product_price;
  }
  const numeric = Number(raw.price.replace(/[^\d]/g, ''));
  return Number.isNaN(numeric) ? 0 : numeric;
}

function parseItem(raw: RawWishListItem): WishListApiItem {
  return {
    itemId: String(raw.id),
    itemName: raw.name,
    shopName: raw.shop?.name ?? '',
    shopId: raw.shop?.url ? extractShopIdFromUrl(raw.shop.url) : '',
    price: parsePrice(raw),
    isAdult: raw.is_adult,
    category: raw.category?.name?.ja ?? null,
    url: raw.url,
    thumbnailUrl: raw.thumbnail_image_urls?.[0] ?? '',
  };
}

/** wish_list_name_items.json のレスポンスをパースする。想定と異なる形式の場合は例外を投げる。 */
export function parseWishListApiResponse(json: unknown): WishListApiPage {
  const data = json as Partial<RawWishListResponse>;
  if (!Array.isArray(data.items) || !data.pagination) {
    throw new Error('unexpected wish_list_name_items.json response shape');
  }

  return {
    items: data.items.map(parseItem),
    pagination: {
      currentPage: data.pagination.current_page,
      nextPage: data.pagination.next_page,
      totalPages: data.pagination.total_pages,
      totalCount: data.pagination.total_count,
    },
  };
}
