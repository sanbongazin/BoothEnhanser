import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

// 実セッションで確認済み(2026-07-21): 好きリストは booth.pm ではなく
// accounts.booth.pm 配下。JSON API (https://accounts.booth.pm/wish_lists.json)
// の存在も確認済みだが、レスポンス形は未検証。
const WISH_LIST_MATCH = 'https://accounts.booth.pm/wish_lists*';
const BOOTH_HOST_MATCH = [
  'https://booth.pm/*',
  'https://*.booth.pm/*',
  'https://accounts.booth.pm/*',
];

export default defineManifest({
  manifest_version: 3,
  name: 'BoothEnhanser',
  description: pkg.description,
  version: pkg.version,
  permissions: ['storage', 'alarms'],
  host_permissions: BOOTH_HOST_MATCH,
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: [WISH_LIST_MATCH],
      js: ['src/content/index.ts'],
      css: ['src/content/content.css'],
      run_at: 'document_idle',
    },
  ],
  action: {
    default_popup: 'src/popup/index.html',
  },
  options_page: 'src/options/index.html',
});
