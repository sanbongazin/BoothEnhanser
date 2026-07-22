import type { ViewMode } from '../../lib/types';

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  card: 'カード表示',
  list: 'リスト表示',
};

const VIEW_MODE_ORDER: ViewMode[] = ['card', 'list'];

export function renderViewModeControl(
  activeMode: ViewMode,
  onChange: (mode: ViewMode) => void,
): HTMLElement {
  const nav = document.createElement('div');
  nav.className = 'be-view-toggle';

  for (const mode of VIEW_MODE_ORDER) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className =
      'be-view-toggle__button' + (mode === activeMode ? ' be-view-toggle__button--active' : '');
    button.textContent = VIEW_MODE_LABELS[mode];
    button.addEventListener('click', () => onChange(mode));
    nav.appendChild(button);
  }

  return nav;
}
