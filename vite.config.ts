import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execFileSync } from 'node:child_process';

// Identificativo della versione: l'hash del commit (su Vercel arriva da VERCEL_GIT_COMMIT_SHA,
// in locale da git) più l'ora della build, così ogni build risulta una versione diversa.
function commitLabel(): string {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (sha) return sha.slice(0, 7);
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'locale';
  }
}

export default defineConfig(() => {
  const buildTime = new Date().toISOString();
  const buildLabel = commitLabel();
  const buildId = `${buildLabel}-${Date.now().toString(36)}`;
  return {
    plugins: [
      react(),
      {
        // Pubblica /version.json accanto all'app: l'app lo confronta con la propria versione
        // per scoprire subito se online c'è qualcosa di nuovo, senza dipendere dal service worker.
        name: 'emit-version-json',
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'version.json',
            source: JSON.stringify({ id: buildId, label: buildLabel, time: buildTime }),
          });
        },
      },
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'prompt',
        injectManifest: {
          // Il PDF si usa raramente e pesa circa 600 KB: non si scarica con la prima installazione.
          // Il service worker lo mette in cache la prima volta che esporti (vedi sw.ts).
          globIgnores: [
            '**/node_modules/**/*',
            'assets/jspdf*',
            'assets/html2canvas*',
            'assets/purify*',
            'assets/index.es-*',
          ],
        },
        includeAssets: ['icon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Conoscermi',
          short_name: 'Conoscermi',
          description: 'Il tuo percorso di rinascita e consapevolezza',
          theme_color: '#fdf9f3',
          background_color: '#fdf9f3',
          display: 'standalone',
          lang: 'it',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
          ]
        }
      })
    ],
    define: {
      __BUILD_ID__: JSON.stringify(buildId),
      __BUILD_LABEL__: JSON.stringify(buildLabel),
      __BUILD_TIME__: JSON.stringify(buildTime),
    },
    build: {
      rollupOptions: {
        output: {
          // Le librerie cambiano di rado, il codice dell'app a ogni deploy. In file separati,
          // a ogni aggiornamento il telefono riscarica solo il codice dell'app, non tutto.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) return 'react';
            if (/node_modules\/(firebase|@firebase)\//.test(id)) return 'firebase';
            if (/node_modules\/(motion|motion-dom|motion-utils|framer-motion)\//.test(id)) return 'motion';
            return undefined;
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(fileURLToPath(new URL('.', import.meta.url))),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
