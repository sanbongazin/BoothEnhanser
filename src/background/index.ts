import browser from 'webextension-polyfill';
import type { ExtensionRequest, ExtensionResponse } from '../messages';
import { getAllItems, getItem, pruneRemovedFavorites, putItem } from '../lib/db';

const RESCAN_ALARM = 'booth-enhanser-daily-rescan';

// content script(BOOTHページのorigin)とbackground/popup/options(拡張機能origin)は
// IndexedDBを共有できないため、IndexedDBへの実アクセスはbackground側に集約し、
// content script/popupはメッセージ経由でCRUDを依頼する。

async function notifyOpenBoothTabs(): Promise<void> {
  const tabs = await browser.tabs.query({ url: ['https://booth.pm/*', 'https://*.booth.pm/*'] });
  await Promise.all(
    tabs
      .filter((tab): tab is typeof tab & { id: number } => tab.id !== undefined)
      .map((tab) =>
        browser.tabs.sendMessage(tab.id, { type: 'RESCAN_REQUESTED' } satisfies ExtensionRequest).catch(() => undefined),
      ),
  );
}

browser.runtime.onInstalled.addListener(() => {
  void browser.alarms.create(RESCAN_ALARM, { periodInMinutes: 60 * 24 });
});

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === RESCAN_ALARM) {
    void notifyOpenBoothTabs();
  }
});

browser.runtime.onMessage.addListener((message: unknown): Promise<ExtensionResponse | undefined> | undefined => {
  const request = message as ExtensionRequest;

  switch (request.type) {
    case 'RESCAN_REQUESTED':
      return notifyOpenBoothTabs().then(() => undefined);
    case 'GET_ALL_ITEMS':
      return getAllItems().then((items) => ({ items }));
    case 'GET_ITEM':
      return getItem(request.itemId).then((item) => ({ item }));
    case 'PUT_ITEM':
      return putItem(request.item).then(() => undefined);
    case 'SET_ITEM_TYPE_OVERRIDE':
      return getItem(request.itemId).then(async (item) => {
        if (!item) return undefined;
        await putItem({ ...item, itemTypeOverride: request.override });
        return undefined;
      });
    case 'PRUNE_REMOVED_FAVORITES':
      return pruneRemovedFavorites(request.currentItemIds).then(() => undefined);
    case 'FETCH_HTML_REQUESTED':
      return fetch(request.url, { credentials: 'include' })
        .then((res) => (res.ok ? res.text() : null))
        .then((html) => ({ html }))
        .catch(() => ({ html: null }));
    default:
      return undefined;
  }
});
