import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import htmlInclude from './plugins/html-include.js';

const root = fileURLToPath(new URL('.', import.meta.url));

// Kök dizindeki her .html dosyası ayrı bir sayfa olarak derlenir
// (index.html, urunler.html, iletisim.html ...).
const pages = Object.fromEntries(
  readdirSync(root)
    .filter((file) => file.endsWith('.html'))
    .map((file) => [file.replace(/\.html$/, ''), resolve(root, file)]),
);

// `npm run dev` sırasında /api ve /auth istekleri Docker'daki nginx'e gider.
// Farklı bir adres için: API_PROXY=http://localhost:8080 npm run dev
const apiProxy = process.env.API_PROXY ?? 'http://localhost';

export default defineConfig({
  plugins: [htmlInclude(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: apiProxy, changeOrigin: false },
      '/auth': { target: apiProxy, changeOrigin: false },
    },
  },
  build: {
    rollupOptions: {
      input: pages,
    },
  },
});
