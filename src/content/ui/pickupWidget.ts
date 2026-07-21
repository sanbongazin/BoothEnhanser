import type { ItemRecord } from '../../lib/types';

export function renderPickupWidget(items: readonly ItemRecord[], onSkip: () => void): HTMLElement {
  const widget = document.createElement('section');
  widget.className = 'be-pickup';

  const heading = document.createElement('h3');
  heading.textContent = '今日のピックアップ';
  widget.appendChild(heading);

  const list = document.createElement('ul');
  list.className = 'be-pickup__list';
  for (const item of items) {
    const li = document.createElement('li');
    li.className = 'be-pickup__item';
    li.textContent = `${item.itemName}(${item.shopName})`;
    list.appendChild(li);
  }
  widget.appendChild(list);

  const skipButton = document.createElement('button');
  skipButton.type = 'button';
  skipButton.className = 'be-pickup__skip';
  skipButton.textContent = 'スキップ';
  skipButton.addEventListener('click', onSkip);
  widget.appendChild(skipButton);

  return widget;
}
