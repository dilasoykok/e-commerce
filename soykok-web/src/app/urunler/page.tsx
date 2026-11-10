import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, SearchX } from 'lucide-react';

import ProductCard from '@/components/product/ProductCard';
import FilterPanel from '@/components/products/FilterPanel';
import SortSelect from '@/components/products/SortSelect';
import { ListNavigationProvider, PendingArea } from '@/components/products/ListNavigation';
import { getCategories, getFacets, searchProducts } from '@/lib/catalog';
import { formatTL } from '@/lib/format';
import {
  EMPTY_STATE,
  PAGE_SIZE,
  expandCategories,
  listTitle,
  parseListState,
  toApiQuery,
  toListUrl,
  type ListState,
} from '@/lib/product-filters';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const state = parseListState(await searchParams);
  const title = listTitle(state, await getCategories());
  return {
    title,
    description:
      'Laminat, masif, vinil, SPC ve LVT parke, deck, aksesuar ve yapı kimyasalları. Filtreleyin, karşılaştırın, güvenle alışveriş yapın.',
    // Filtreli/sıralı sayfaların hepsi aynı listenin varyasyonu: arama motorları ana adresi esas alsın
    alternates: { canonical: state.categories.length === 1 ? toListUrl({ ...EMPTY_STATE, categories: state.categories }) : '/urunler' },
  };
}

/**
 * Ürün listesi (eski urunler.html + product-list.js).
 * Filtreler adres çubuğunda; sayfa sunucuda çizilir ve ürünler doğrudan
 * GET /api/products'tan gelir (kategori grubu, marka, fiyat, sıralama API'de).
 */
export default async function ProductsPage({ searchParams }: Props) {
  const state = parseListState(await searchParams);
  const [catalog, facets, result] = await Promise.all([getCategories(), getFacets(), searchProducts(toApiQuery(state))]);

  const title = listTitle(state, catalog);
  const names = new Map(catalog.categories.map((c) => [c.slug, c.name]));
  const labels = new Map(catalog.groups.map((g) => [g.slug, g.label]));
  const remaining = result.total - result.items.length;

  const categoryOptions = catalog.categories.map((c) => ({
    value: c.slug,
    label: c.name,
    count: facets.categoryCounts[c.slug] ?? 0,
  }));
  const brandOptions = facets.brands.map((b) => ({ value: b.name, label: b.name, count: b.count }));

  return (
    <ListNavigationProvider state={state}>
      <div className="container-site py-6 lg:py-8">
        {/* Breadcrumb */}
        <nav aria-label="Sayfa yolu" className="text-xs text-gray-500">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-brand-900">
                Ana Sayfa
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-3.5" strokeWidth={1.75} />
            </li>
            <li aria-current="page" className="font-medium text-brand-900">
              {title}
            </li>
          </ol>
        </nav>

        {/* Başlık + sıralama */}
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="mt-0.5 text-sm text-gray-500" aria-live="polite">
              {result.total} ürün listeleniyor
            </p>
          </div>
          <SortSelect />
        </div>

        {/* Aktif filtre etiketleri: düz linkler, JavaScript olmadan da çalışır */}
        <ActiveFilters state={state} label={(c) => labels.get(c) ?? names.get(c) ?? c} />

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[250px_1fr]">
          <aside className="lg:sticky lg:top-4">
            <FilterPanel
              categories={categoryOptions}
              brands={brandOptions}
              checkedCategories={expandCategories(state.categories, catalog)}
            />
          </aside>

          <section aria-label="Ürün listesi">
            <PendingArea>
              {result.items.length > 0 ? (
                <>
                  <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {result.items.map((p, i) => (
                      <ProductCard key={p.id} product={p} priority={i < 4} />
                    ))}
                  </ul>

                  {remaining > 0 && state.page * PAGE_SIZE < 100 && (
                    <div className="mt-8 text-center">
                      <Link
                        href={toListUrl({ ...state, page: state.page + 1 })}
                        scroll={false}
                        className="inline-flex h-11 items-center rounded border border-brand-900 px-8 text-sm font-semibold text-brand-900 transition hover:bg-brand-900 hover:text-white"
                      >
                        Daha Fazla Göster ({remaining})
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center rounded-md border border-dashed border-gray-300 px-6 py-16 text-center">
                  <span className="grid size-16 place-items-center rounded-full bg-gray-100 text-gray-400">
                    <SearchX className="size-7" strokeWidth={1.75} aria-hidden />
                  </span>
                  <p className="mt-4 font-semibold">Aradığınız kriterlere uygun ürün bulunamadı</p>
                  <p className="mt-1 text-sm text-gray-500">Filtreleri değiştirerek ya da temizleyerek tekrar deneyin.</p>
                  <Link
                    href="/urunler"
                    className="mt-5 inline-flex h-10 items-center rounded bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Filtreleri Temizle
                  </Link>
                </div>
              )}
            </PendingArea>
          </section>
        </div>
      </div>
    </ListNavigationProvider>
  );
}

/** Seçili filtreler; her biri o filtreyi kaldıran bir link */
function ActiveFilters({ state, label }: { state: ListState; label: (slug: string) => string }) {
  const without = (patch: Partial<ListState>) => toListUrl({ ...state, page: 1, ...patch });

  const chips: { key: string; text: string; href: string }[] = [];
  if (state.q) chips.push({ key: 'q', text: `"${state.q}"`, href: without({ q: '' }) });
  state.categories.forEach((c) =>
    chips.push({ key: `k-${c}`, text: label(c), href: without({ categories: state.categories.filter((x) => x !== c) }) }),
  );
  state.brands.forEach((b) =>
    chips.push({ key: `m-${b}`, text: b, href: without({ brands: state.brands.filter((x) => x !== b) }) }),
  );
  if (state.min || state.max) {
    const from = state.min ? formatTL(Number(state.min)) : '0 TL';
    const to = state.max ? formatTL(Number(state.max)) : '∞';
    chips.push({ key: 'fiyat', text: `${from} – ${to}`, href: without({ min: '', max: '' }) });
  }
  if (state.discounted) chips.push({ key: 'indirim', text: 'İndirimli', href: without({ discounted: false }) });

  if (!chips.length) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <Link
          key={c.key}
          href={c.href}
          scroll={false}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white py-1 pr-2 pl-3 text-xs hover:border-brand-900"
        >
          {c.text}
          <span aria-hidden className="text-gray-400">
            ✕
          </span>
          <span className="sr-only">filtresini kaldır</span>
        </Link>
      ))}
      {chips.length > 1 && (
        <Link
          href={toListUrl({ ...EMPTY_STATE, sort: state.sort })}
          scroll={false}
          className="text-xs font-medium text-gray-500 underline hover:text-sale"
        >
          Tümünü temizle
        </Link>
      )}
    </div>
  );
}
