'use client';

import Form from 'next/form';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, Search } from 'lucide-react';
import { SEARCH_CATEGORIES } from '@/lib/navigation';

/**
 * Header'daki arama kutusu. Ürünler sayfasındayken mevcut aramayla dolu gelir
 * (eski product-list.js'teki headerSearch.value = state.q).
 * next/form: GET formu sayfayı yenilemeden /urunler?q=... adresine götürür.
 */
export default function HeaderSearch() {
  const params = useSearchParams();
  const onList = usePathname() === '/urunler';
  const q = onList ? (params.get('q') ?? '') : '';
  const kategori = onList ? (params.get('kategori') ?? '') : '';
  const known = SEARCH_CATEGORIES.some((c) => c.value === kategori);

  // key: adres değişince kutular yeni değerle baştan çizilir
  return <SearchForm key={`${q}|${kategori}`} q={q} kategori={known ? kategori : ''} />;
}

export function SearchForm({ q = '', kategori = '' }: { q?: string; kategori?: string }) {
  return (
    <Form
      action="/urunler"
      role="search"
      className="order-last flex h-11 w-full overflow-hidden rounded-md border border-gray-300 focus-within:border-brand-700 lg:order-none lg:mx-auto lg:h-[38px] lg:max-w-[625px] lg:flex-1"
    >
      <label htmlFor="q" className="sr-only">
        Ürün ara
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={q}
        placeholder="Ürün, kategori veya marka arayın..."
        className="min-w-0 flex-1 px-4 text-sm placeholder:text-gray-400 focus:outline-none"
      />

      <div className="relative hidden border-l border-gray-200 sm:block">
        <label htmlFor="cat" className="sr-only">
          Kategori
        </label>
        <select
          id="cat"
          name="kategori"
          defaultValue={kategori}
          className="h-full w-40 cursor-pointer appearance-none bg-transparent pr-8 pl-4 text-xs text-gray-600 focus:outline-none"
        >
          {SEARCH_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-gray-500"
          strokeWidth={1.75}
          aria-hidden
        />
      </div>

      <button
        type="submit"
        className="grid w-12 place-items-center bg-brand-900 text-white transition hover:bg-brand-700"
        aria-label="Ara"
      >
        <Search className="size-5" strokeWidth={1.75} aria-hidden />
      </button>
    </Form>
  );
}
