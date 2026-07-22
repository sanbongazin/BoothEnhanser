import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { createManifest } from './manifest.config';

// Chrome/Edge向けビルド(EdgeはChromium系でMV3拡張機能をそのまま読み込めるため共用)。
// Firefox向けは vite.config.firefox.ts を参照。
export default defineConfig({
  plugins: [crx({ manifest: createManifest('chrome'), browser: 'chrome' })],
  build: {
    outDir: 'dist/chrome',
    emptyOutDir: true,
  },
});
