import browser from 'webextension-polyfill';
import { getAllItems } from '../lib/dbClient';
import type { ExtensionRequest } from '../messages';

async function init(): Promise<void> {
  const items = await getAllItems();
  const countEl = document.getElementById('item-count');
  if (countEl) countEl.textContent = `キャッシュ件数: ${items.length}`;

  document.getElementById('rescan-button')?.addEventListener('click', () => {
    const message: ExtensionRequest = { type: 'RESCAN_REQUESTED' };
    void browser.runtime.sendMessage(message);
  });

  document.getElementById('options-link')?.addEventListener('click', (event) => {
    event.preventDefault();
    void browser.runtime.openOptionsPage();
  });
}

void init();
