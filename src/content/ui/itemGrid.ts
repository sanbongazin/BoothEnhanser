import type { ItemRecord, ItemType, TabKey } from '../../lib/types';
import { resolveItemType } from '../../lib/classify';

type OverrideHandler = (itemId: string, override: ItemType) => void;

function formatPrice(price: number): string {
  return `¥${price.toLocaleString('ja-JP')}`;
}

// サムネイル上へのオーバーレイ表示なので、タグ数が多い商品でもカードの高さが揃うよう控えめな件数に絞る。
const MAX_VISIBLE_AVATAR_TAGS = 3;
const AVATAR_TAGS_AREA_CLASS = 'be-avatar-tags-area';

/**
 * 対応アバター候補の表示領域を作る。
 * - 非アバター商品でまだ商品詳細ページを取得していなければ、読み込み中の表示にする。
 * - 取得済みでタグがあればチップ表示、無ければ何も表示しない(nullを返す)。
 */
function renderAvatarTagsArea(item: ItemRecord, maxVisible: number): HTMLElement | null {
  const isNonAvatar = resolveItemType(item) === 'non-avatar';
  const isLoading = isNonAvatar && item.avatarTagsScannedAt === null;

  if (!isLoading && item.avatarTags.length === 0) return null;

  const wrap = document.createElement('div');
  wrap.className = AVATAR_TAGS_AREA_CLASS;

  if (isLoading) {
    wrap.classList.add('be-avatar-tags--loading');
    const spinner = document.createElement('span');
    spinner.className = 'be-avatar-tags__spinner';
    wrap.appendChild(spinner);
    return wrap;
  }

  for (const tag of item.avatarTags.slice(0, maxVisible)) {
    const chip = document.createElement('span');
    chip.className = 'be-avatar-tag';
    chip.textContent = tag;
    wrap.appendChild(chip);
  }

  const remaining = item.avatarTags.slice(maxVisible);
  if (remaining.length > 0) {
    const more = document.createElement('span');
    more.className = 'be-avatar-tag be-avatar-tag--more';
    more.textContent = `+${remaining.length}`;
    more.tabIndex = 0;
    // ホバー/フォーカス時にCSSの::afterで表示しきれなかったタグ一覧を出す(content.css参照)
    more.dataset.tooltip = remaining.join('、');
    wrap.appendChild(more);
  }

  return wrap;
}

/** 「今日のピックアップ」対象カードに付ける吹き出しバッジ。専有スペースの大きいバー表示の代わり。 */
function renderPickupBubble(): HTMLElement {
  const bubble = document.createElement('span');
  bubble.className = 'be-pickup-bubble';
  bubble.textContent = 'ピックアップ!';
  return bubble;
}

function renderOverrideControls(item: ItemRecord, onOverride: OverrideHandler): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'be-override';

  const avatarButton = document.createElement('button');
  avatarButton.type = 'button';
  avatarButton.textContent = 'これはアバターです';
  avatarButton.addEventListener('click', (event) => {
    event.preventDefault();
    onOverride(item.itemId, 'avatar');
  });
  wrap.appendChild(avatarButton);

  const nonAvatarButton = document.createElement('button');
  nonAvatarButton.type = 'button';
  nonAvatarButton.textContent = 'これはアバター以外です';
  nonAvatarButton.addEventListener('click', (event) => {
    event.preventDefault();
    onOverride(item.itemId, 'non-avatar');
  });
  wrap.appendChild(nonAvatarButton);

  return wrap;
}

function renderCard(
  item: ItemRecord,
  tab: TabKey,
  isPickedUp: boolean,
  onOverride: OverrideHandler,
): HTMLElement {
  const card = document.createElement('article');
  card.className = 'be-card' + (isPickedUp ? ' be-card--pickup' : '');
  card.dataset.beItemId = item.itemId;

  const link = document.createElement('a');
  link.className = 'be-card__link';
  link.href = item.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'be-card__thumb-wrap';

  const thumb = document.createElement('img');
  thumb.className = 'be-card__thumb';
  thumb.src = item.thumbnailUrl;
  thumb.alt = '';
  thumb.loading = 'lazy';
  thumbWrap.appendChild(thumb);

  if (item.isAdult) {
    const badge = document.createElement('span');
    badge.className = 'be-card__badge';
    badge.textContent = 'R-18';
    thumbWrap.appendChild(badge);
  }

  if (isPickedUp) {
    thumbWrap.appendChild(renderPickupBubble());
  }

  // 対応アバターのタグはサムネイル上にオーバーレイ表示する(カードの高さを揃えるため)
  const avatarTagsArea = renderAvatarTagsArea(item, MAX_VISIBLE_AVATAR_TAGS);
  if (avatarTagsArea) thumbWrap.appendChild(avatarTagsArea);

  link.appendChild(thumbWrap);

  const name = document.createElement('span');
  name.className = 'be-card__name';
  name.textContent = item.itemName;
  link.appendChild(name);

  card.appendChild(link);

  const meta = document.createElement('div');
  meta.className = 'be-card__meta';

  const shop = document.createElement('span');
  shop.className = 'be-card__shop';
  shop.textContent = item.shopName;
  meta.appendChild(shop);

  const price = document.createElement('span');
  price.className = 'be-card__price';
  price.textContent = formatPrice(item.price);
  meta.appendChild(price);

  card.appendChild(meta);

  if (tab === 'other') {
    card.appendChild(renderOverrideControls(item, onOverride));
  }

  return card;
}

/** フィルタ・ソート済みの商品一覧をカード表示で描画する。 */
export function renderItemGrid(
  items: readonly ItemRecord[],
  tab: TabKey,
  pickedUpItemIds: ReadonlySet<string>,
  onOverride: OverrideHandler,
): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'be-grid';
  for (const item of items) {
    grid.appendChild(renderCard(item, tab, pickedUpItemIds.has(item.itemId), onOverride));
  }
  return grid;
}

/**
 * グリッド全体を再描画せず、指定した商品1件分の対応アバター表示領域だけを差し替える。
 * バックグラウンドの詳細ページ取得(1商品ずつ非同期に完了する)のたびに全体を再描画すると
 * 画面全体がチカチカするため、該当カード/行だけをピンポイントで更新するために使う。
 * 現在表示されていない商品(タブ絞り込みで非表示中など)の場合は何もしない。
 */
export function updateItemAvatarTagsInPlace(container: ParentNode, item: ItemRecord): void {
  const escapedId = CSS.escape(item.itemId);
  const target = container.querySelector<HTMLElement>(`[data-be-item-id="${escapedId}"]`);
  if (!target) return;

  target.querySelector(`.${AVATAR_TAGS_AREA_CLASS}`)?.remove();

  const thumbWrap = target.querySelector<HTMLElement>('.be-card__thumb-wrap');
  if (!thumbWrap) return;

  const avatarTagsArea = renderAvatarTagsArea(item, MAX_VISIBLE_AVATAR_TAGS);
  if (avatarTagsArea) thumbWrap.appendChild(avatarTagsArea);
}
