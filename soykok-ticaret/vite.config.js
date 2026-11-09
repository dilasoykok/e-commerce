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

export default defineConfig({
  plugins: [htmlInclude(), tailwindcss()],
  build: {
    rollupOptions: {
      input: pages,
    },
  },
});
