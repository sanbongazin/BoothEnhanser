import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

// TODO(verify-against-live-booth): 実際のお気に入り(スキ)一覧ページのURLパターンは
// 未検証。ログイン中セッションで https://booth.pm/... 配下の実URLを確認して
// content_scripts の matches を確定させること。
const WISH_LIST_MATCH = 'https://booth.pm/*/users/*/wish_list*';
const BOOTH_HOST_MATCH = ['https://booth.pm/*', 'https://*.booth.pm/*'];

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
