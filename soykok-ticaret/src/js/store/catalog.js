/**
 * Ürün kataloğu — backend API'den (/api) yüklenir.
 *
 * API'ye ulaşılamazsa (ör. Docker kapalıyken sadece `npm run dev` çalışıyorsa)
 * data/products.js'teki statik veriye düşer; site her iki durumda da çalışır.
 *
 * Değerler `export let` olduğu için loadCatalog() tamamlandıktan sonra bunları
 * import eden tüm modüller otomatik olarak güncel veriyi görür.
 *
 * Kullanım:
 *   import { PRODUCTS, CATEGORIES, loadCatalog } from '../store/catalog.js';
 *   await loadCatalog();
 */
import * as fallback from '../data/products.js';

export let PRODUCTS = fallback.PRODUCTS;
export let CATEGORIES = fallback.CATEGORIES;
export let CATEGORY_GROUPS = fallback.CATEGORY_GROUPS;
export let GROUP_LABELS = fallback.GROUP_LABELS;
export const DEFAULT_DETAILS = fallback.DEFAULT_DETAILS;

/** 'api' ya da 'static' — verinin nereden geldiği */
export let source = 'static';

const API_BASE = '/api';
const TIMEOUT_MS = 5000;
const PAGE_SIZE = 100; // API'nin izin verdiği en büyük sayfa

let loading = null;

async function getJson(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API_BASE + path, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Tüm ürünleri sayfa sayfa çeker. */
async function fetchAllProducts() {
  const items = [];
  for (let page = 1; ; page++) {
    const data = await getJson(`/products?page=${page}&pageSize=${PAGE_SIZE}`);
    items.push(...data.items);
    if (items.length >= data.total || data.items.length === 0) return items;
  }
}

/** Kataloğu bir kez yükler; sonraki çağrılar aynı sonucu bekler. */
export function loadCatalog() {
  loading ??= (async () => {
    try {
      const [products, catalog] = await Promise.all([fetchAllProducts(), getJson('/categories')]);
      PRODUCTS = products;
      CATEGORIES = Object.fromEntries(catalog.categories.map((c) => [c.slug, c.name]));
      CATEGORY_GROUPS = Object.fromEntries(catalog.groups.map((g) => [g.slug, g.categories]));
      GROUP_LABELS = Object.fromEntries(catalog.groups.map((g) => [g.slug, g.label]));
      source = 'api';
    } catch (err) {
      console.warn('[catalog] API\'ye ulaşılamadı, statik ürün verisi kullanılıyor.', err);
    }
  })();
  return loading;
}

const isEmpty = (v) =>
  v == null ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

/** Boş alanları atar; böylece DEFAULT_DETAILS'teki varsayılanlar ezilmez. */
const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => !isEmpty(v)));

/**
 * Ürün detayları (açıklama, özellikler, görseller, paket m²).
 * DEFAULT_DETAILS ile birleştirilmek üzere yalnızca dolu alanları döndürür.
 */
export async function loadProductDetail(id) {
  await loadCatalog();
  if (source === 'api') {
    try {
      const d = await getJson(`/products/${encodeURIComponent(id)}`);
      return compact({
        boxM2: d.boxM2,
        images: d.images,
        description: d.description,
        features: d.features,
        specs: d.specs,
      });
    } catch (err) {
      console.warn(`[catalog] ${id} detayı alınamadı, statik veri kullanılıyor.`, err);
    }
  }
  return fallback.PRODUCT_DETAILS[id] ?? {};
}
