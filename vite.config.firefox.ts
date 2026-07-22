import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { createManifest } from './manifest.config';

// Firefox向けビルド。npm run build:firefox / dev:firefox から使用する。
export default defineConfig({
  plugins: [crx({ manifest: createManifest('firefox'), browser: 'firefox' })],
  build: {
    outDir: 'dist/firefox',
    emptyOutDir: true,
  },
});
