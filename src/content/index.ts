import browser from 'webextension-polyfill';
import type { ItemRecord, ItemType, SortMode, TabKey } from '../lib/types';
import { inferItemType } from '../lib/classify';
import {
  getAllItems,
  getItem,
  pruneRemovedFavorites,
  putItem,
  setItemTypeOverride,
} from '../lib/dbClient';
import { sortItems } from '../lib/sort';
import { selectPickupItems } from '../lib/pickup';
import {
  parseWishListApiResponse,
  WISH_LISTS_JSON_URL,
  wishListPageUrl,
  type WishListApiItem,
} from '../lib/wishListApi';
import { filterByTab, renderTabBar } from './ui/tabs';
import { renderSortControl } from './ui/sortControl';
import { renderPickupWidget } from './ui/pickupWidget';
import { renderItemList } from './ui/itemList';
import type { ExtensionRequest } from '../messages';

// 収集は「閲覧」の範囲に留める(自動操作はしない)ため、JSON APIページ取得の間隔を空ける
const FETCH_DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 実セッションで確認済み(2026-07-22): 素の fetch() だと {"item_ids":[...], "wishlists_counts":{...}}
// という別形状のレスポンスが返る。BOOTH本体のSPAがAjax判別用に付けていると思われる
// ヘッダーを付与することで、items/pagination付きの一覧レスポンスに切り替わることを期待する。
const WISH_LIST_FETCH_HEADERS: HeadersInit = {
  Accept: 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

/** 好きリストJSON API(全ページ)からアイテム一覧を取得する。 */
async function fetchAllWishListItems(): Promise<WishListApiItem[]> {
  const items: WishListApiItem[] = [];
  let page = 1;
  let url = WISH_LISTS_JSON_URL;

  while (page) {
    const res = await fetch(url, { credentials: 'include', headers: WISH_LIST_FETCH_HEADERS });
    if (!res.ok) {
      throw new Error(`wish_lists.json fetch failed: page=${page} status=${res.status}`);
    }

    const json: unknown = await res.json();
    let parsedPage;
    try {
      parsedPage = parseWishListApiResponse(json);
    } catch (cause) {
      const preview = JSON.stringify(json).slice(0, 300);
      throw new Error(`wish_lists.json unexpected shape at page=${page}: ${preview}`, { cause });
    }
    items.push(...parsedPage.items);

    if (!parsedPage.pagination.nextPage || parsedPage.pagination.nextPage <= page) break;
    page = parsedPage.pagination.nextPage;
    url = wishListPageUrl(page);
    await sleep(FETCH_DELAY_MS);
  }

  return items;
}

/**
 * JSON APIから得たアイテムをItemRecordへマージする。JSON APIには登録日・更新日・タグが
 * 含まれないため、既存レコードの値を維持する(初回取得時は暫定でnowを入れる)。
 */
async function refreshItem(apiItem: WishListApiItem): Promise<void> {
  const existing = await getItem(apiItem.itemId);
  const now = new Date().toISOString();
  const itemType = inferItemType({ category: apiItem.category, tags: existing?.tags ?? [] });

  const record: ItemRecord = {
    itemId: apiItem.itemId,
    itemName: apiItem.itemName,
    shopName: apiItem.shopName,
    shopId: apiItem.shopId,
    price: apiItem.price,
    registeredAt: existing?.registeredAt ?? now,
    updatedAt: now,
    tags: existing?.tags ?? [],
    avatarTags: existing?.avatarTags ?? [],
    isAdult: apiItem.isAdult,
    itemType,
    itemTypeOverride: existing?.itemTypeOverride ?? null,
    affinityScore: existing?.affinityScore ?? null,
    scoredWithProfileVersion: existing?.scoredWithProfileVersion ?? null,
    yomiOverride: existing?.yomiOverride ?? {},
    lastPickedAt: existing?.lastPickedAt ?? null,
  };

  await putItem(record);
}

async function scanWishList(): Promise<void> {
  const apiItems = await fetchAllWishListItems();
  await pruneRemovedFavorites(apiItems.map((item) => item.itemId));

  for (const apiItem of apiItems) {
    await refreshItem(apiItem);
  }
}

interface State {
  tab: TabKey;
  sort: SortMode;
  reshuffleNonce: number;
}

const state: State = {
  tab: 'avatar',
  sort: 'registered-new',
  reshuffleNonce: 0,
};

function mountRoot(): HTMLElement {
  const existing = document.querySelector('.be-root');
  if (existing) return existing as HTMLElement;

  const root = document.createElement('div');
  root.className = 'be-root';
  document.body.prepend(root);
  return root;
}

async function handleOverride(itemId: string, override: ItemType): Promise<void> {
  await setItemTypeOverride(itemId, override);
  await render();
}

async function render(): Promise<void> {
  const root = mountRoot();
  root.innerHTML = '';

  const allItems = await getAllItems();

  root.appendChild(renderTabBar(state.tab, (tab) => void ((state.tab = tab), render())));
  root.appendChild(renderSortControl(state.sort, (sort) => void ((state.sort = sort), render())));

  const pickupItems = selectPickupItems(allItems, {
    forceReshuffle: state.reshuffleNonce || undefined,
  });
  root.appendChild(
    renderPickupWidget(pickupItems, () => {
      state.reshuffleNonce += 1;
      void render();
    }),
  );

  const tabItems = filterByTab(allItems, state.tab);
  const sorted = sortItems(tabItems, state.sort);
  root.appendChild(
    renderItemList(sorted, state.tab, (itemId, override) => void handleOverride(itemId, override)),
  );
}

browser.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as ExtensionRequest;
  if (msg?.type === 'RESCAN_REQUESTED') {
    void scanWishList().then(render);
  }
});

void (async () => {
  await render();
  await scanWishList();
  await render();
})();
