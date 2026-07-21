import type { ItemRecord, ItemType } from './lib/types';

// content script(BOOTHページのorigin)とpopup/options(拡張機能のorigin)はIndexedDBを
// 共有できないため、実データはbackground(拡張機能origin)側でのみ保持し、
// 双方はメッセージ経由でCRUDを行う。

export type ExtensionRequest =
  | { type: 'RESCAN_REQUESTED' }
  | { type: 'GET_ALL_ITEMS' }
  | { type: 'GET_ITEM'; itemId: string }
  | { type: 'PUT_ITEM'; item: ItemRecord }
  | { type: 'SET_ITEM_TYPE_OVERRIDE'; itemId: string; override: ItemType }
  | { type: 'PRUNE_REMOVED_FAVORITES'; currentItemIds: string[] };

export interface ExtensionResponse {
  items?: ItemRecord[];
  item?: ItemRecord;
}
