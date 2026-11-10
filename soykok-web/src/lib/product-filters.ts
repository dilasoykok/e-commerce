/**
 * Ürün listesi filtreleri ↔ adres çubuğu (eski product-list.js → readStateFromUrl / writeStateToUrl).
 * Sunucu (sayfa) ve tarayıcı (filtre paneli) aynı fonksiyonları kullanır.
 *
 *   /urunler?q=meşe&kategori=laminat,spc&marka=Egger&min=500&max=2000&indirim=1&sirala=fiyat-artan&sayfa=2
 *
 * Parametre adları backend'deki GET /api/products ile aynı (sayfa hariç).
 */

import type { CatalogCategories, ProductQuery } from './types';

export type Sort = NonNullable<ProductQuery['sirala']>;

export const SORTS: { value: Sort; label: string }[] = [
  { value: 'onerilen', label: 'Önerilen' },
  { value: 'populer', label: 'Çok Satanlar' },
  { value: 'yeni', label: 'En Yeniler' },
  { value: 'fiyat-artan', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'fiyat-azalan', label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'puan', label: 'En Yüksek Puan' },
];

/** Her "Daha Fazla Göster" bu kadar ürün ekler */
export const PAGE_SIZE = 12;

export type ListState = {
  q: string;
  /** Adres çubuğundaki haliyle: üst grup (parke) ya da alt kategoriler (laminat,spc) */
  categories: string[];
  brands: string[];
  min: string;
  max: string;
  discounted: boolean;
  sort: Sort;
  /** Kaç "sayfa" gösteriliyor (1 → ilk 12 ürün) */
  page: number;
};

export const EMPTY_STATE: ListState = {
  q: '',
  categories: [],
  brands: [],
  min: '',
  max: '',
  discounted: false,
  sort: 'onerilen',
  page: 1,
};

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

function getParam(params: RawParams, key: string): string {
  if (params instanceof URLSearchParams) return params.get(key) ?? '';
  const v = params[key];
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

const list = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

const priceParam = (s: string) => (/^\d+(\.\d+)?$/.test(s) ? s : '');

export function parseListState(params: RawParams): ListState {
  const sort = getParam(params, 'sirala') as Sort;
  const page = Number(getParam(params, 'sayfa'));
  return {
    q: getParam(params, 'q').trim(),
    categories: list(getParam(params, 'kategori')),
    brands: list(getParam(params, 'marka')),
    min: priceParam(getParam(params, 'min')),
    max: priceParam(getParam(params, 'max')),
    discounted: getParam(params, 'indirim') === '1',
    sort: SORTS.some((s) => s.value === sort) ? sort : 'onerilen',
    page: Number.isInteger(page) && page > 1 ? Math.min(page, 20) : 1,
  };
}

/** Durum → "?kategori=parke&sirala=yeni" (varsayılan değerler yazılmaz) */
export function toListUrl(state: ListState, path = '/urunler'): string {
  const sp = new URLSearchParams();
  if (state.q) sp.set('q', state.q);
  if (state.categories.length) sp.set('kategori', state.categories.join(','));
  if (state.brands.length) sp.set('marka', state.brands.join(','));
  if (state.min) sp.set('min', state.min);
  if (state.max) sp.set('max', state.max);
  if (state.discounted) sp.set('indirim', '1');
  if (state.sort !== 'onerilen') sp.set('sirala', state.sort);
  if (state.page > 1) sp.set('sayfa', String(state.page));
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Durum → backend sorgusu. Sayfalı yükleme: ilk N sayfanın tamamı tek istekte gelir. */
export function toApiQuery(state: ListState): ProductQuery {
  return {
    q: state.q || undefined,
    kategori: state.categories.join(',') || undefined,
    marka: state.brands.join(',') || undefined,
    min: state.min ? Number(state.min) : undefined,
    max: state.max ? Number(state.max) : undefined,
    indirim: state.discounted || undefined,
    sirala: state.sort,
    page: 1,
    pageSize: Math.min(PAGE_SIZE * state.page, 100),
  };
}

/** "parke" → ["laminat", "masif", ...]; alt kategori olduğu gibi kalır (onay kutuları için) */
export function expandCategories(selected: string[], catalog: CatalogCategories): string[] {
  const groups = new Map(catalog.groups.map((g) => [g.slug, g.categories]));
  return [...new Set(selected.flatMap((c) => groups.get(c) ?? [c]))];
}

/** Bir kategorinin üst grubu ("laminat" → "parke"); "zemin" gibi geniş gruplar en son tercih edilir */
export function parentGroup(category: string, catalog: CatalogCategories): string | null {
  const matches = catalog.groups.filter((g) => g.categories.includes(category));
  matches.sort((a, b) => a.categories.length - b.categories.length);
  return matches[0]?.slug ?? null;
}

const hasFilters = (s: ListState) => Boolean(s.q || s.brands.length || s.min || s.max || s.discounted);

/** Seçili filtreye göre sayfa başlığı: "Laminat Parke", "Aksesuarlar", "Egger", "Çok Satanlar"... */
export function listTitle(state: ListState, catalog: CatalogCategories): string {
  const names = new Map(catalog.categories.map((c) => [c.slug, c.name]));
  const labels = new Map(catalog.groups.map((g) => [g.slug, g.label]));
  const cats = state.categories;

  if (cats.length === 1) return labels.get(cats[0]) ?? names.get(cats[0]) ?? 'Tüm Ürünler';
  if (cats.length > 1) {
    const key = [...cats].sort().join(',');
    const group = catalog.groups.find((g) => [...g.categories].sort().join(',') === key);
    if (group) return group.label;
    return 'Tüm Ürünler';
  }
  if (state.brands.length === 1 && !state.q) return state.brands[0];
  if (!hasFilters(state) && state.sort === 'populer') return 'Çok Satanlar';
  if (!hasFilters(state) && state.sort === 'yeni') return 'Yeni Ürünler';
  if (state.discounted && !state.q && !state.brands.length) return 'İndirimli Ürünler';
  if (state.q) return `"${state.q}" için sonuçlar`;
  return 'Tüm Ürünler';
}
