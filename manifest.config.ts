import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

// 実セッションで確認済み(2026-07-22): 好きリストは booth.pm ではなく
// accounts.booth.pm 配下。一覧取得には wish_list_name_items.json を使う
// (詳細は src/lib/wishListApi.ts のコメントを参照)。
const WISH_LIST_MATCH = 'https://accounts.booth.pm/wish_lists*';
const BOOTH_HOST_MATCH = [
  'https://booth.pm/*',
  'https://*.booth.pm/*',
  'https://accounts.booth.pm/*',
];

const ICONS = {
  16: 'icons/icon-16.png',
  32: 'icons/icon-32.png',
  48: 'icons/icon-48.png',
  128: 'icons/icon-128.png',
};

export type BuildTarget = 'chrome' | 'firefox';

// Chrome/EdgeはMV3 service workerのbackgroundに対応しているが、@crxjs/vite-pluginの
// Firefoxターゲットはscripts形式のバックグラウンド(非persistentなイベントページ)を
// 前提とするため、ターゲット別に分岐する。
export function createManifest(target: BuildTarget) {
  return defineManifest({
    manifest_version: 3,
    name: 'BoothEnhanser',
    description: pkg.description,
    version: pkg.version,
    icons: ICONS,
    permissions: ['storage', 'alarms'],
    host_permissions: BOOTH_HOST_MATCH,
    background:
      target === 'firefox'
        ? { scripts: ['src/background/worker.ts'], persistent: false }
        : { service_worker: 'src/background/worker.ts', type: 'module' },
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
      default_icon: ICONS,
      default_title: 'BoothEnhanser',
    },
    options_page: 'src/options/index.html',
    ...(target === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'booth-enhanser@sanbongazin.github.io',
              strict_min_version: '109.0',
            },
          },
        }
      : {}),
  });
}

export default createManifest('chrome');
