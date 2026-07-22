import type { ViewMode } from '../../lib/types';

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  card: 'カード表示',
  list: 'リスト表示',
};

// currentColorで塗るのでボタンのテキスト色にそのまま追従する(アクティブ時は白、非アクティブ時はグレー)
const VIEW_MODE_ICONS: Record<ViewMode, string> = {
  card: `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>`,
  list: `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="1" y1="3" x2="15" y2="3"/><line x1="1" y1="8" x2="15" y2="8"/><line x1="1" y1="13" x2="15" y2="13"/></svg>`,
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
    button.innerHTML = VIEW_MODE_ICONS[mode];
    button.title = VIEW_MODE_LABELS[mode];
    button.setAttribute('aria-label', VIEW_MODE_LABELS[mode]);
    button.setAttribute('aria-pressed', String(mode === activeMode));
    button.addEventListener('click', () => onChange(mode));
    nav.appendChild(button);
  }

  return nav;
}
