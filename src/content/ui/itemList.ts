import type { ItemRecord, ItemType, TabKey } from '../../lib/types';

export function renderItemList(
  items: readonly ItemRecord[],
  tab: TabKey,
  onOverride: (itemId: string, override: ItemType) => void,
): HTMLElement {
  const list = document.createElement('ul');
  list.className = 'be-item-list';

  for (const item of items) {
    const li = document.createElement('li');
    li.className = 'be-item-list__item';

    const label = document.createElement('span');
    label.textContent = `${item.itemName}(${item.shopName}) — ¥${item.price}`;
    li.appendChild(label);

    // 「その他」タブのみ: 手動でアバター/アバター以外を割り当てる簡易導線
    if (tab === 'other') {
      const avatarButton = document.createElement('button');
      avatarButton.type = 'button';
      avatarButton.textContent = 'これはアバターです';
      avatarButton.addEventListener('click', () => onOverride(item.itemId, 'avatar'));
      li.appendChild(avatarButton);

      const nonAvatarButton = document.createElement('button');
      nonAvatarButton.type = 'button';
      nonAvatarButton.textContent = 'これはアバター以外です';
      nonAvatarButton.addEventListener('click', () => onOverride(item.itemId, 'non-avatar'));
      li.appendChild(nonAvatarButton);
    }

    list.appendChild(li);
  }

  return list;
}
