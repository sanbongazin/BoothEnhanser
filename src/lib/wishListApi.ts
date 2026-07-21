// accounts.booth.pm の好きリストJSON APIを解析するモジュール。
// 実セッションで確認済み(2026-07-21): https://accounts.booth.pm/wish_lists.json は
// Rails(kaminari想定)スタイルのページネーションを持つJSONを返し、各アイテムに
// is_adult・category.name.ja・tracking_data.product_price が直接含まれるため、
// 好きリスト一覧ページのDOM解析(価格テキスト・R18バッジ・カテゴリセレクタ)より
// 優先して使う。ページングのクエリパラメータ名(`page`)はレスポンスの
// current_page/next_page構造から妥当と判断したが、実リクエストURLでの最終確認は未了。
export const WISH_LISTS_JSON_URL = 'https://accounts.booth.pm/wish_lists.json';

export function wishListPageUrl(page: number): string {
  return `${WISH_LISTS_JSON_URL}?page=${page}`;
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
  };
}

/** wish_lists.json のレスポンスをパースする。想定と異なる形式の場合は例外を投げる。 */
export function parseWishListApiResponse(json: unknown): WishListApiPage {
  const data = json as Partial<RawWishListResponse>;
  if (!Array.isArray(data.items) || !data.pagination) {
    throw new Error('unexpected wish_lists.json response shape');
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
