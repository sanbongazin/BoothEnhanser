import browser from 'webextension-polyfill';
import type { ItemRecord, ItemType, SortMode, TabKey } from '../lib/types';
import {
  extractItemFromDocument,
  extractNextPageUrl,
  extractWishListEntries,
} from '../lib/extractor';
import { inferItemType } from '../lib/classify';
import { getAllItems, getItem, pruneRemovedFavorites, putItem, setItemTypeOverride } from '../lib/dbClient';
import { sortItems } from '../lib/sort';
import { selectPickupItems } from '../lib/pickup';
import { filterByTab, renderTabBar } from './ui/tabs';
import { renderSortControl } from './ui/sortControl';
import { renderPickupWidget } from './ui/pickupWidget';
import { renderItemList } from './ui/itemList';
import type { ExtensionRequest } from '../messages';

// 収集は「閲覧」の範囲に留める(自動操作はしない)ため、商品ページ取得の間隔を空ける
const FETCH_DELAY_MS = 300;
// 再抽出済みの直近キャッシュを不要に再取得しないための猶予(ミリ秒)
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchDocument(url: string): Promise<Document> {
  const res = await fetch(url, { credentials: 'include' });
  const text = await res.text();
  return new DOMParser().parseFromString(text, 'text/html');
}

async function collectWishListEntries(startDoc: Document): Promise<{ itemId: string; url: string }[]> {
  const results: { itemId: string; url: string }[] = [];
  let doc: Document | null = startDoc;

  while (doc) {
    results.push(...extractWishListEntries(doc));
    const next = extractNextPageUrl(doc);
    if (!next) break;
    await sleep(FETCH_DELAY_MS);
    doc = await fetchDocument(next);
  }

  return results;
}

function isStale(item: ItemRecord | undefined): boolean {
  if (!item) return true;
  return Date.now() - new Date(item.updatedAt || item.registeredAt || 0).getTime() > STALE_AFTER_MS;
}

async function refreshItem(entry: { itemId: string; url: string }): Promise<void> {
  const existing = await getItem(entry.itemId);
  if (!isStale(existing)) return;

  const doc = await fetchDocument(entry.url);
  const parsed = extractItemFromDocument(doc, entry.url);
  if (!parsed) return;

  const now = new Date().toISOString();
  const itemType = inferItemType({ category: parsed.category, tags: parsed.tags });

  const record: ItemRecord = {
    itemId: parsed.itemId,
    itemName: parsed.itemName,
    shopName: parsed.shopName,
    shopId: parsed.shopId,
    price: parsed.price,
    registeredAt: parsed.registeredAt ?? existing?.registeredAt ?? now,
    updatedAt: parsed.updatedAt ?? now,
    tags: parsed.tags,
    avatarTags: existing?.avatarTags ?? [],
    isAdult: parsed.isAdult,
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
  const entries = await collectWishListEntries(document);
  await pruneRemovedFavorites(entries.map((e) => e.itemId));

  for (const entry of entries) {
    await refreshItem(entry);
    await sleep(FETCH_DELAY_MS);
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

  const pickupItems = selectPickupItems(allItems, { forceReshuffle: state.reshuffleNonce || undefined });
  root.appendChild(
    renderPickupWidget(pickupItems, () => {
      state.reshuffleNonce += 1;
      void render();
    }),
  );

  const tabItems = filterByTab(allItems, state.tab);
  const sorted = sortItems(tabItems, state.sort);
  root.appendChild(renderItemList(sorted, state.tab, (itemId, override) => void handleOverride(itemId, override)));
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
