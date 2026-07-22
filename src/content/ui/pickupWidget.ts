import type { ItemRecord } from '../../lib/types';

/**
 * ピックアップされた商品名の一覧はここでは描画しない(下の既存グリッド内で該当カードを
 * ハイライトする方式に統一しているため)。ここでは見出しと件数、スキップ操作のみを担う。
 */
export function renderPickupWidget(items: readonly ItemRecord[], onSkip: () => void): HTMLElement {
  const widget = document.createElement('section');
  widget.className = 'be-pickup';

  const heading = document.createElement('h3');
  heading.textContent = '今日のピックアップ';
  widget.appendChild(heading);

  const count = document.createElement('p');
  count.className = 'be-pickup__count';
  count.textContent =
    items.length > 0 ? `${items.length}件を下の一覧でハイライトしています。` : '対象の商品がありません。';
  widget.appendChild(count);

  const skipButton = document.createElement('button');
  skipButton.type = 'button';
  skipButton.className = 'be-pickup__skip';
  skipButton.textContent = 'スキップ';
  skipButton.addEventListener('click', onSkip);
  widget.appendChild(skipButton);

  return widget;
}
