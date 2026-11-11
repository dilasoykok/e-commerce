import type { CatalogCategories, Product } from './types';
import type { NavLink } from './navigation';

/*
 * Site menüsü, arama kutusunun kategori listesi ve arama önerileri — sabit liste yerine
 * veritabanındaki kategorilerden üretilir (admin panelinde eklenen kategori menüye kendiliğinden girer).
 *   Üst kategoriler (gruplar) → menü başlıkları, alt kategoriler → açılan panel
 *   Hiçbir üst kategoride olmayan alt kategoriler → menüde tek başına başlık
 * Server Component'te hesaplanıp client bileşenlere düz veri (ikon adı dahil) olarak geçilir.
 */

/** İkon adı → components/layout/CategoryIcon.tsx */
export type CategoryIconName =
  | 'layers' | 'ruler' | 'flask' | 'grid' | 'wall' | 'building' | 'sofa' | 'boxes' | 'paint' | 'wrench' | 'droplets';

export type CategoryNavItem = NavLink & {
  icon: CategoryIconName;
  children?: NavLink[];
  brands?: NavLink[];
};

export type SearchOption = { value: string; label: string };

/** Arama önerisi (kategori/marka). Ürün önerileri canlı olarak API'den gelir. */
export type SearchSuggestion = { kind: 'category' | 'brand'; label: string; href: string; hint?: string };

export type SiteNav = {
  menu: CategoryNavItem[];
  searchOptions: SearchOption[];
  suggestions: SearchSuggestion[];
};

/** Bilinen kodların ikonları; yeni eklenen kategoriler varsayılan ikonu alır */
const ICONS: Record<string, CategoryIconName> = {
  boya: 'paint',
  hirdavat: 'wrench',
  tesisat: 'droplets',
  'insaat-malzemeleri': 'wall',
  parke: 'layers',
  aksesuar: 'ruler',
  kimyasal: 'flask',
  zemin: 'grid',
  duvar: 'wall',
  insaat: 'building',
  dekorasyon: 'sofa',
};

const MAX_BRANDS = 5;

export const categoryHref = (slug: string) => `/urunler?kategori=${encodeURIComponent(slug)}`;
export const brandHref = (name: string) => `/urunler?marka=${encodeURIComponent(name)}`;

export function buildSiteNav(catalog: CatalogCategories, products: Product[]): SiteNav {
  const names = new Map(catalog.categories.map((c) => [c.slug, c.name]));
  const grouped = new Set(catalog.groups.flatMap((g) => g.categories));
  const ungrouped = catalog.categories.filter((c) => !grouped.has(c.slug));

  // Grupta en çok ürünü olan markalar (panelin "Markalar" bölümü)
  const topBrands = (categories: string[]): NavLink[] => {
    const set = new Set(categories);
    const counts = new Map<string, number>();
    for (const p of products) if (set.has(p.category)) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr'))
      .slice(0, MAX_BRANDS)
      .map(([name]) => ({ href: brandHref(name), label: name }));
  };

  const menu: CategoryNavItem[] = [
    ...catalog.groups.map((g) => {
      const children = g.categories
        .filter((s) => names.has(s))
        .map((s) => ({ href: categoryHref(s), label: names.get(s)! }));
      const brands = children.length ? topBrands(g.categories) : [];
      return {
        href: categoryHref(g.slug),
        label: g.label,
        icon: ICONS[g.slug] ?? 'grid',
        children: children.length ? children : undefined,
        brands: brands.length ? brands : undefined,
      };
    }),
    ...ungrouped.map((c) => ({ href: categoryHref(c.slug), label: c.name, icon: ICONS[c.slug] ?? 'grid' })),
    { href: '/#markalar', label: 'Markalar', icon: 'boxes' as const },
  ];

  const searchOptions: SearchOption[] = [
    { value: '', label: 'Tüm Kategoriler' },
    ...catalog.groups.map((g) => ({ value: g.slug, label: g.label })),
    ...ungrouped.map((c) => ({ value: c.slug, label: c.name })),
  ];

  const groupOf = (slug: string) => catalog.groups.find((g) => g.categories.includes(slug))?.label;
  const brands = [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'tr'));
  const suggestions: SearchSuggestion[] = [
    ...catalog.groups.map((g) => ({ kind: 'category' as const, label: g.label, href: categoryHref(g.slug), hint: 'Kategori' })),
    ...catalog.categories.map((c) => ({
      kind: 'category' as const,
      label: c.name,
      href: categoryHref(c.slug),
      hint: groupOf(c.slug) ?? 'Kategori',
    })),
    ...brands.map((b) => ({ kind: 'brand' as const, label: b, href: brandHref(b), hint: 'Marka' })),
  ];

  return { menu, searchOptions, suggestions };
}
