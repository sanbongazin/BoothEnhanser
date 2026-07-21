import browser from 'webextension-polyfill';
import type { ExtensionRequest, ExtensionResponse } from '../messages';
import type { ItemRecord, ItemType } from './types';

// content script/popup/optionsから、background側のIndexedDBへメッセージ経由でアクセスする
// クライアント。db.tsと同じ関数名を揃え、呼び出し側のコードを直接アクセス版と同じ形に保つ。

async function send(request: ExtensionRequest): Promise<ExtensionResponse | undefined> {
  return browser.runtime.sendMessage(request) as Promise<ExtensionResponse | undefined>;
}

export async function getAllItems(): Promise<ItemRecord[]> {
  const res = await send({ type: 'GET_ALL_ITEMS' });
  return res?.items ?? [];
}

export async function getItem(itemId: string): Promise<ItemRecord | undefined> {
  const res = await send({ type: 'GET_ITEM', itemId });
  return res?.item;
}

export async function putItem(item: ItemRecord): Promise<void> {
  await send({ type: 'PUT_ITEM', item });
}

export async function setItemTypeOverride(itemId: string, override: ItemType): Promise<void> {
  await send({ type: 'SET_ITEM_TYPE_OVERRIDE', itemId, override });
}

export async function pruneRemovedFavorites(currentItemIds: string[]): Promise<void> {
  await send({ type: 'PRUNE_REMOVED_FAVORITES', currentItemIds });
}
