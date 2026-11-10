import 'server-only';

/**
 * Ürün kataloğu — SUNUCUDA çalışır (eski src/js/store/catalog.js'in yerine).
 *
 * Server Component'ler ürünleri doğrudan backend'den çeker; tarayıcıya hazır
 * HTML gider. API'ye ulaşılamazsa (ör. Docker kapalıyken sadece `npm run dev`)
 * data/products.ts'teki statik veriye düşer; site her iki durumda da çalışır.
 *
 * Önbellek: Cevaplar en fazla 60 sn tutulur ve "catalog" etiketi taşır. Admin
 * bir ürünü değiştirince app/actions/catalog.ts bu etiketi yeniler, değişiklik
 * hemen görünür.
 */

import * as fallback from '@/data/products';
import { api } from './api/endpoints';
import { ApiError } from './api/client';
import type { CatalogCategories, Product, ProductDetail, ProductPage, ProductQuery } from './types';

export const CATALOG_TAG = 'catalog';
const cacheOpts = { next: { revalidate: 60, tags: [CATALOG_TAG] } };

const warn = (what: string, err: unknown) =>
  console.warn(`[catalog] ${what}: API'ye ulaşılamadı, statik veri kullanılıyor.`, err instanceof Error ? err.message : err);

/* ---------- Statik yedek veride sıralama (API'deki ProductSorts ile aynı) ---------- */

export type ProductSort = NonNullable<ProductQuery['sirala']>;

function sortStatic(list: Product[], sort: ProductSort): Product[] {
  const copy = [...list];
  switch (sort) {
    case 'populer':
      return copy.sort((a, b) => b.sales - a.sales);
    case 'yeni':
      return copy.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    case 'fiyat-artan':
      return copy.sort((a, b) => a.price - b.price);
    case 'fiyat-azalan':
      return copy.sort((a, b) => b.price - a.price);
    case 'puan':
      return copy.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    default:
      return copy;
  }
}

const discountRatio = (p: Product) => (p.oldPrice ? (p.oldPrice - p.price) / p.oldPrice : 0);

/* ---------- Listeler ---------- */

type ListOptions = { sort?: ProductSort; limit?: number; onlyDiscounted?: boolean };

/**
 * Ürün listesi. Ana sayfadaki slider'lar için:
 *   getProducts({ sort: 'yeni', limit: 10 })
 *   getProducts({ sort: 'populer', limit: 10 })
 */
export async function getProducts({ sort = 'onerilen', limit = 24, onlyDiscounted = false }: ListOptions = {}): Promise<Product[]> {
  try {
    const page = await api.catalog.products(
      { sirala: sort, pageSize: Math.min(limit, 100), indirim: onlyDiscounted },
      cacheOpts,
    );
    return page.items;
  } catch (err) {
    warn('ürün listesi', err);
    const list = onlyDiscounted ? fallback.PRODUCTS.filter((p) => p.oldPrice) : fallback.PRODUCTS;
    return sortStatic(list, sort).slice(0, limit);
  }
}

/** İndirimdeki ürünler, en yüksek indirim oranı önce */
export async function getDiscountedProducts(limit = 12): Promise<Product[]> {
  const list = await getProducts({ onlyDiscounted: true, limit: 100 });
  return [...list].sort((a, b) => discountRatio(b) - discountRatio(a)).slice(0, limit);
}

/** Belirli ürünler, verilen sırada (ör. "Sizin İçin Seçtiklerimiz") */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const all = await getProducts({ limit: 100 });
  const byId = new Map(all.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
}

/* ---------- Ürün listesi sayfası (filtreli) ---------- */

const normalize = (s: string) => s.toLocaleLowerCase('tr-TR').trim();

/** GET /api/products — filtre, sıralama, sayfa. API yoksa aynı kurallarla statik veride arar. */
export async function searchProducts(query: ProductQuery): Promise<ProductPage> {
  try {
    return await api.catalog.products(query, cacheOpts);
  } catch (err) {
    warn('ürün arama', err);
    const groups = fallback.CATEGORY_GROUPS;
    const cats = new Set((query.kategori ?? '').split(',').filter(Boolean).flatMap((c) => groups[c] ?? [c]));
    const brands = new Set((query.marka ?? '').split(',').filter(Boolean));
    const q = normalize(query.q ?? '');

    const filtered = fallback.PRODUCTS.filter((p) => {
      if (q && !normalize(`${p.name} ${p.brand} ${fallback.CATEGORIES[p.category] ?? ''}`).includes(q)) return false;
      if (cats.size && !cats.has(p.category)) return false;
      if (brands.size && !brands.has(p.brand)) return false;
      if (query.min != null && p.price < query.min) return false;
      if (query.max != null && p.price > query.max) return false;
      if (query.indirim && !p.oldPrice) return false;
      return true;
    });
    const sorted = sortStatic(filtered, query.sirala ?? 'onerilen');
    const page = query.page ?? 1;
    const size = query.pageSize ?? 24;
    return { total: sorted.length, page, pageSize: size, items: sorted.slice((page - 1) * size, page * size) };
  }
}

/** Filtre panelindeki kategori ve marka listeleri, yanlarındaki ürün sayılarıyla */
export async function getFacets(): Promise<{ categoryCounts: Record<string, number>; brands: { name: string; count: number }[] }> {
  const all = await getProducts({ limit: 100 });
  const categoryCounts: Record<string, number> = {};
  const brandCounts = new Map<string, number>();
  for (const p of all) {
    categoryCounts[p.category] = (categoryCounts[p.category] ?? 0) + 1;
    brandCounts.set(p.brand, (brandCounts.get(p.brand) ?? 0) + 1);
  }
  const brands = [...brandCounts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  return { categoryCounts, brands };
}

/* ---------- Tek ürün ---------- */

/** Ürün detayı; ürün yoksa null (sayfa notFound() çağırır) */
export async function getProduct(id: string): Promise<ProductDetail | null> {
  try {
    return await api.catalog.product(id, cacheOpts);
  } catch (err) {
    if (err instanceof ApiError && err.isNotFound) return null;
    warn(`ürün ${id}`, err);
    const p = fallback.PRODUCTS.find((x) => x.id === id);
    if (!p) return null;
    const extra = { ...fallback.DEFAULT_DETAILS, ...fallback.PRODUCT_DETAILS[id] };
    return { ...p, ...extra, images: extra.images ?? [p.image] };
  }
}

/* ---------- Kategoriler ---------- */

export async function getCategories(): Promise<CatalogCategories> {
  try {
    return await api.catalog.categories(cacheOpts);
  } catch (err) {
    warn('kategoriler', err);
    return {
      categories: Object.entries(fallback.CATEGORIES).map(([slug, name]) => ({ slug, name })),
      groups: Object.entries(fallback.CATEGORY_GROUPS).map(([slug, categories]) => ({
        slug,
        label: fallback.GROUP_LABELS[slug] ?? slug,
        categories,
      })),
    };
  }
}
