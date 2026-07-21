import type { SortMode } from '../../lib/types';

const SORT_LABELS: Record<SortMode, string> = {
  'price-asc': '価格が安い順',
  'price-desc': '価格が高い順',
  'registered-new': '登録日が新しい順',
  'registered-old': '登録日が古い順',
  'updated-new': '更新日が新しい順',
  'updated-old': '更新日が古い順',
  'shop-name-ja': 'ショップ名(あいうえお順)',
  'item-name-ja': '商品名(あいうえお順)',
  random: 'ランダム',
};

const SORT_ORDER: SortMode[] = [
  'price-asc',
  'price-desc',
  'registered-new',
  'registered-old',
  'updated-new',
  'updated-old',
  'shop-name-ja',
  'item-name-ja',
  'random',
];

export function renderSortControl(activeSort: SortMode, onChange: (sort: SortMode) => void): HTMLElement {
  const select = document.createElement('select');
  select.className = 'be-sort-control';

  for (const mode of SORT_ORDER) {
    const option = document.createElement('option');
    option.value = mode;
    option.textContent = SORT_LABELS[mode];
    option.selected = mode === activeSort;
    select.appendChild(option);
  }

  select.addEventListener('change', () => onChange(select.value as SortMode));
  return select;
}
