import type { ItemRecord, TabKey } from '../../lib/types';
import { resolveItemType } from '../../lib/classify';

const TAB_LABELS: Record<TabKey, string> = {
  avatar: 'アバター',
  'non-avatar-all-ages': 'アバター以外(全年齢)',
  'non-avatar-adult': 'アバター以外(R-18)',
  other: 'その他',
};

const TAB_ORDER: TabKey[] = ['avatar', 'non-avatar-all-ages', 'non-avatar-adult', 'other'];

export function filterByTab(items: readonly ItemRecord[], tab: TabKey): ItemRecord[] {
  return items.filter((item) => {
    const type = resolveItemType(item);
    switch (tab) {
      case 'avatar':
        return type === 'avatar';
      case 'non-avatar-all-ages':
        return type === 'non-avatar' && !item.isAdult;
      case 'non-avatar-adult':
        return type === 'non-avatar' && item.isAdult;
      case 'other':
        return type === 'unknown';
    }
  });
}

export function renderTabBar(activeTab: TabKey, onSelect: (tab: TabKey) => void): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = 'be-tabs';

  for (const tab of TAB_ORDER) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'be-tab' + (tab === activeTab ? ' be-tab--active' : '');
    button.textContent = TAB_LABELS[tab];
    button.addEventListener('click', () => onSelect(tab));
    nav.appendChild(button);
  }

  return nav;
}
