import fs from 'node:fs';
import path from 'node:path';
import { normalizePath } from 'vite';

/**
 * Basit HTML partial eklentisi.
 *
 * Kullanım:
 *   <include src="header.html"></include>
 *   <include src="header.html" megaPinned="data-pinned"></include>
 *
 * - src, `dir` klasörüne göre çözülür (varsayılan: src/partials).
 * - Partial içindeki {{degisken}} yer tutucuları, include etiketindeki
 *   aynı adlı özelliğin değeriyle değiştirilir. Verilmeyenler boş kalır.
 * - Partial'lar başka partial'ları include edebilir.
 * - Bir partial değişince tarayıcı otomatik yenilenir.
 */
const INCLUDE_RE = /<include\s+src="([^"]+)"([^>]*)>\s*<\/include>/g;
const ATTR_RE = /([\w-]+)="([^"]*)"/g;
const VAR_RE = /\{\{\s*([\w-]+)\s*\}\}/g;

export default function htmlInclude({ dir = 'src/partials' } = {}) {
  let partialsDir;

  const render = (html, depth = 0) => {
    if (depth > 10) throw new Error('[html-include] Include derinliği 10’u aştı (döngüsel include olabilir).');

    return html.replace(INCLUDE_RE, (_, src, attrs) => {
      const file = path.resolve(partialsDir, src);
      if (!fs.existsSync(file)) {
        throw new Error(`[html-include] Partial bulunamadı: ${src} (${file})`);
      }

      const vars = Object.fromEntries([...attrs.matchAll(ATTR_RE)].map((m) => [m[1], m[2]]));
      const content = fs
        .readFileSync(file, 'utf-8')
        .replace(VAR_RE, (_, key) => vars[key] ?? '');

      return render(content, depth + 1);
    });
  };

  return {
    name: 'html-include',

    configResolved(config) {
      partialsDir = path.resolve(config.root, dir);
    },

    transformIndexHtml: {
      order: 'pre',
      handler: (html) => render(html),
    },

    // Partial kaydedilince sayfayı yenile (Vite sürümünden bağımsız çalışır)
    configureServer(server) {
      server.watcher.add(partialsDir);
      const reload = (file) => {
        if (normalizePath(file).startsWith(normalizePath(partialsDir))) {
          server.ws.send({ type: 'full-reload', path: '*' });
        }
      };
      server.watcher.on('change', reload);
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
    },
  };
}
