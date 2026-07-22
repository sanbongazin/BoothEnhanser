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
  | { type: 'PRUNE_REMOVED_FAVORITES'; currentItemIds: string[] }
  // 実セッションで確認済み(2026-07-22): content scriptからの他オリジン(booth.pm等)への
  // fetch()はページ側のCORS制限を受けて失敗する(host_permissionsによるCORSバイパスは
  // background/popup等の拡張機能ページからのfetchにしか効かない)。そのため商品詳細ページの
  // 取得はbackground側で行い、HTML文字列だけをcontent scriptへ返す。
  | { type: 'FETCH_HTML_REQUESTED'; url: string };

export interface ExtensionResponse {
  items?: ItemRecord[];
  item?: ItemRecord;
  html?: string | null;
}
