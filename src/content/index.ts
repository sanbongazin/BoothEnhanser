import browser from 'webextension-polyfill';
import type { ItemRecord, ItemType, SortMode, TabKey, ViewMode } from '../lib/types';
import { inferItemType, resolveItemType } from '../lib/classify';
import {
  fetchHtml,
  getAllItems,
  getItem,
  pruneRemovedFavorites,
  putItem,
  setItemTypeOverride,
} from '../lib/dbClient';
import { sortItems } from '../lib/sort';
import { selectPickupItems } from '../lib/pickup';
import { extractAvatarCompatTags } from '../lib/avatarCompat';
import {
  parseWishListApiResponse,
  wishListPageUrl,
  type WishListApiItem,
} from '../lib/wishListApi';
import { filterByTab, renderTabBar } from './ui/tabs';
import { renderSortControl } from './ui/sortControl';
import { renderViewModeControl } from './ui/viewModeControl';
import { renderSearchControl } from './ui/searchControl';
import { renderItemGrid, updateItemAvatarTagsInPlace } from './ui/itemGrid';
import { filterBySearchQuery } from '../lib/search';
import type { ExtensionRequest } from '../messages';

// 収集は「閲覧」の範囲に留める(自動操作はしない)ため、JSON APIページ取得の間隔を空ける
const FETCH_DELAY_MS = 300;
// 商品詳細ページは一覧APIより重いため、間隔をやや長めに取る
const AVATAR_SCAN_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 好きリストJSON API(全ページ)からアイテム一覧を取得する。 */
async function fetchAllWishListItems(): Promise<WishListApiItem[]> {
  const items: WishListApiItem[] = [];
  let page = 1;
  let url = wishListPageUrl(page);

  while (page) {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      throw new Error(`wish_list_name_items.json fetch failed: page=${page} status=${res.status}`);
    }

    const json: unknown = await res.json();
    let parsedPage;
    try {
      parsedPage = parseWishListApiResponse(json);
    } catch (cause) {
      const preview = JSON.stringify(json).slice(0, 300);
      throw new Error(`wish_list_name_items.json unexpected shape at page=${page}: ${preview}`, {
        cause,
      });
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
    url: apiItem.url,
    thumbnailUrl: apiItem.thumbnailUrl,
    price: apiItem.price,
    registeredAt: existing?.registeredAt ?? now,
    updatedAt: now,
    tags: existing?.tags ?? [],
    avatarTags: existing?.avatarTags ?? [],
    avatarTagsScannedAt: existing?.avatarTagsScannedAt ?? null,
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

/**
 * アバター以外の商品について、商品詳細ページから対応アバター候補を抽出してavatarTagsを埋める。
 * 1商品につき1回だけ取得すればよいので、avatarTagsScannedAtが未設定の商品のみを対象にする。
 */
async function scanAvatarCompatTags(): Promise<void> {
  const allItems = await getAllItems();
  const targets = allItems.filter((item) => resolveItemType(item) === 'non-avatar'); // DEBUG: 抽出ロジック改善を反映するため一時的にキャッシュ条件を無視

  for (const item of targets) {
    const scannedAt = new Date().toISOString();
    let updated: ItemRecord;
    try {
      const html = await fetchHtml(item.url);
      const avatarTags = html
        ? extractAvatarCompatTags(new DOMParser().parseFromString(html, 'text/html'))
        : [];
      updated = { ...item, avatarTags, avatarTagsScannedAt: scannedAt };
    } catch (err) {
      console.error(`[BoothEnhanser] avatar compat scan failed itemId=${item.itemId}`, err);
      // 取得失敗時も無限リトライを避けるため取得済み扱いにする
      updated = { ...item, avatarTagsScannedAt: scannedAt };
    }
    await putItem(updated);

    // グリッド全体を再描画すると表示中の商品が多いほど画面全体がチカチカするため、
    // 該当カード/行だけをピンポイントで更新する(未表示中のタブなら何もしない)。
    const root = document.querySelector<HTMLElement>('.be-root');
    if (root) updateItemAvatarTagsInPlace(root, updated);

    await sleep(AVATAR_SCAN_DELAY_MS);
  }
}

interface State {
  tab: TabKey;
  sort: SortMode;
  viewMode: ViewMode;
  searchQuery: string;
}

const state: State = {
  tab: 'non-avatar-all-ages',
  sort: 'registered-new',
  viewMode: 'card',
  searchQuery: '',
};

interface NativeWishListRefs {
  /** フォルダタブ行・カードグリッド・ページングなどを並べて持つ共通の親要素 */
  container: HTMLElement;
  /** 商品カードのグリッド本体 */
  grid: HTMLElement;
  /** グリッドより後の兄弟要素(ページングなど) */
  after: HTMLElement[];
}

/**
 * BOOTH本体の「スキした商品」セクションから、カードグリッド・ページングの要素を取得する。
 * フォルダタブ行(すべて/未分類/…)・件数/「スキの管理」行(グリッドより前の兄弟)は、
 * 自前タブの選択状態に関わらず常にBOOTHネイティブのまま操作可能にしておくため、ここでは
 * 参照しない(隠す/無効化する対象は自前グリッドで完全に置き換わるグリッド本体とページングのみ)。
 *
 * BOOTH側のクラス名(Tailwindのハッシュ付きutility class)は変わりやすいため、
 * `.item-card-wrapper` (実セッションで確認済み: 商品カードの共通クラス)を起点に、その親
 * (グリッド本体)・祖父(フォルダタブ行/件数行/グリッド/ページングを並べて持つ共通コンテナ)
 * という相対位置関係で特定する。見つからない場合(未ログイン・0件など)はnull。
 */
function findNativeWishListRefs(): NativeWishListRefs | null {
  const firstCard = document.querySelector<HTMLElement>('.item-card-wrapper');
  const grid = firstCard?.parentElement ?? null;
  const container = grid?.parentElement ?? null;
  if (!grid || !container) return null;

  // container.insertBefore(root, grid)で自前rootをcontainerの子として差し込んでいるため、
  // 2回目以降のrender()ではchildrenに.be-root自身が混ざる。afterの判定から除外する。
  const children = (Array.from(container.children) as HTMLElement[]).filter(
    (el) => !el.classList.contains('be-root'),
  );
  const gridIndex = children.indexOf(grid);
  if (gridIndex === -1) return null;

  return {
    container,
    grid,
    after: children.slice(gridIndex + 1),
  };
}

/**
 * 自前UIを、ページの先頭(ヘッダーより上)ではなく、BOOTHネイティブなカードグリッドが
 * あった位置(フォルダタブ行・件数/「スキの管理」行のすぐ後ろ)に差し込む。
 *
 * 実セッションで確認済み(2026-07-22): BOOTHの好きリストはSPAで、`.item-card-wrapper`は
 * document_idle時点ではまだDOMに存在しないことがある(データ取得のXHRが後から走るため)。
 * そのため初回はrefsが見つからずbody先頭へ一時的にフォールバックすることがあるが、
 * 以後のrender()呼び出しでrefsが見つかり次第、正しい位置へ移動し直す。
 */
function mountRoot(refs: NativeWishListRefs | null): HTMLElement {
  let root = document.querySelector<HTMLElement>('.be-root');
  if (!root) {
    root = document.createElement('div');
    root.className = 'be-root';
    if (refs) {
      refs.container.insertBefore(root, refs.grid);
    } else {
      document.body.prepend(root);
    }
    return root;
  }

  if (refs && root.nextElementSibling !== refs.grid) {
    refs.container.insertBefore(root, refs.grid);
  }
  return root;
}

/**
 * ネイティブなカードグリッドとページングは自前のフィルタ済みグリッドに完全に置き換えるため
 * 常に隠す。フォルダタブ行(すべて/未分類/…)・件数/「スキの管理」行はここでは一切触れず、
 * 自前タブの選択状態に関わらずBOOTHネイティブのまま常に操作可能にしておく。
 */
function hideNativeGrid(refs: NativeWishListRefs | null): void {
  if (!refs) return;

  refs.grid.style.display = 'none';
  for (const el of refs.after) el.style.display = 'none';
}

let nativeObserver: MutationObserver | null = null;
let pendingReapply: number | null = null;

/**
 * 実セッションで確認済み(2026-07-22): ネイティブのフォルダタブ(すべて/未分類/…)をクリックすると
 * BOOTH側のSPAがグリッド・ページングのDOMを丸ごと再描画する。新しいノードは自前の非表示状態を
 * 引き継がないため、放置するとページ番号リンクなどが再度見えてしまう。MutationObserverでDOM変化
 * を検知し、都度hideNativeGridを再適用する(hideNativeGrid自体はstyle属性の変更のみで
 * childListを変えないため、自己トリガーの無限ループにはならない)。
 */
function watchNativeWishListMutations(): void {
  if (nativeObserver) return;
  nativeObserver = new MutationObserver(() => {
    if (pendingReapply !== null) return;
    pendingReapply = requestAnimationFrame(() => {
      pendingReapply = null;
      hideNativeGrid(findNativeWishListRefs());
    });
  });
  nativeObserver.observe(document.body, { childList: true, subtree: true });
}

async function handleOverride(itemId: string, override: ItemType): Promise<void> {
  await setItemTypeOverride(itemId, override);
  await render();
}

/**
 * 検索欄にフォーカス中に再描画すると入力位置が失われるため、render()の前後でフォーカス/
 * カーソル位置を保存・復元する。searchControl.ts側はIME変換中・入力の間引き(debounce)を
 * 行っているが、debounce後に発火するrender()自体はフォーカスを保持しないため、ここで補う。
 */
function captureSearchInputFocus(): { selectionStart: number | null; selectionEnd: number | null } | null {
  const active = document.activeElement;
  if (!(active instanceof HTMLInputElement) || !active.classList.contains('be-search__input')) {
    return null;
  }
  return { selectionStart: active.selectionStart, selectionEnd: active.selectionEnd };
}

function restoreSearchInputFocus(
  root: HTMLElement,
  saved: { selectionStart: number | null; selectionEnd: number | null } | null,
): void {
  if (!saved) return;
  const input = root.querySelector<HTMLInputElement>('.be-search__input');
  if (!input) return;
  input.focus();
  if (saved.selectionStart !== null && saved.selectionEnd !== null) {
    input.setSelectionRange(saved.selectionStart, saved.selectionEnd);
  }
}

async function render(): Promise<void> {
  const refs = findNativeWishListRefs();

  const root = mountRoot(refs);
  const savedSearchFocus = captureSearchInputFocus();
  root.innerHTML = '';
  root.appendChild(renderTabBar(state.tab, (tab) => void ((state.tab = tab), render())));
  hideNativeGrid(refs);

  const allItems = await getAllItems();

  const controls = document.createElement('div');
  controls.className = 'be-controls';
  controls.appendChild(
    renderSearchControl(state.searchQuery, (query) => void ((state.searchQuery = query), render())),
  );

  const rightControls = document.createElement('div');
  rightControls.className = 'be-controls__right';
  rightControls.appendChild(
    renderViewModeControl(state.viewMode, (viewMode) => void ((state.viewMode = viewMode), render())),
  );
  rightControls.appendChild(
    renderSortControl(state.sort, (sort) => void ((state.sort = sort), render())),
  );
  controls.appendChild(rightControls);
  root.appendChild(controls);

  const pickupItems = selectPickupItems(allItems);
  const pickedUpItemIds = new Set(pickupItems.map((item) => item.itemId));

  const tabItems = filterByTab(allItems, state.tab);
  const searched = filterBySearchQuery(tabItems, state.searchQuery);
  const sorted = sortItems(searched, state.sort);

  if (state.searchQuery.trim() && sorted.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'be-search__empty';
    empty.textContent = '一致する商品が見つかりませんでした。';
    root.appendChild(empty);
  } else {
    root.appendChild(
      renderItemGrid(sorted, state.tab, state.viewMode, pickedUpItemIds, (itemId, override) =>
        void handleOverride(itemId, override),
      ),
    );
  }

  restoreSearchInputFocus(root, savedSearchFocus);
}

browser.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as ExtensionRequest;
  if (msg?.type === 'RESCAN_REQUESTED') {
    void scanWishList()
      .then(render)
      .then(scanAvatarCompatTags);
  }
});

void (async () => {
  watchNativeWishListMutations();
  await render();
  await scanWishList();
  await render();
  await scanAvatarCompatTags();
})();
