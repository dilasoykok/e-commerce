'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Form from 'next/form';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronDown, Loader2, Search, Tag, FolderOpen } from 'lucide-react';

import { api } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { formatTL } from '@/lib/format';
import { productHref } from '@/lib/routes';
import type { SearchOption, SearchSuggestion } from '@/lib/category-nav';
import type { Product } from '@/lib/types';
import { productImageSrc, isUploadedImage } from '@/lib/product-image';

const SW = 1.75;
const MIN_CHARS = 2;
const MAX_CATEGORIES = 4;
const MAX_BRANDS = 3;
const MAX_PRODUCTS = 5;

type Props = { options: SearchOption[]; suggestions: SearchSuggestion[] };

/**
 * Header'daki arama kutusu. Ürünler sayfasındayken mevcut aramayla dolu gelir.
 * 2 harf yazınca altta öneriler açılır: eşleşen kategoriler, markalar ve ürünler
 * ("la" → Laminat Parke, ...). Enter ya da büyüteç tüm sonuçlar sayfasına gider.
 */
export default function HeaderSearch(props: Props) {
  const params = useSearchParams();
  const onList = usePathname() === '/urunler';
  const q = onList ? (params.get('q') ?? '') : '';
  const kategori = onList ? (params.get('kategori') ?? '') : '';
  const known = props.options.some((c) => c.value === kategori);

  // key: adres değişince kutular yeni değerle baştan çizilir
  return <SearchForm key={`${q}|${kategori}`} q={q} kategori={known ? kategori : ''} {...props} />;
}

/** Türkçe büyük/küçük harf + şapkasız eşleşme: "SUPURGE" → "Süpürgelik" */
function fold(s: string) {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıİ]/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[âà]/g, 'a')
    .replace(/[î]/g, 'i')
    .replace(/[û]/g, 'u');
}

/** Eşleşme puanı: baştan eşleşen > kelime başında > içinde geçen (eşleşmezse -1) */
function score(label: string, term: string) {
  const l = fold(label);
  if (l.startsWith(term)) return 3;
  if (l.split(/[\s\-/()]+/).some((w) => w.startsWith(term))) return 2;
  return l.includes(term) ? 1 : -1;
}

type Item =
  | { type: 'suggestion'; key: string; href: string; data: SearchSuggestion }
  | { type: 'product'; key: string; href: string; data: Product }
  | { type: 'all'; key: string; href: string };

export function SearchForm({ q = '', kategori = '', options, suggestions }: Props & { q?: string; kategori?: string }) {
  const router = useRouter();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(q);
  const [term, setTerm] = useState(''); // yazmayı bırakınca (150 ms) aranan
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const folded = fold(term.trim());
  const searching = folded.length >= MIN_CHARS;

  useEffect(() => {
    const t = setTimeout(() => setTerm(value), 150);
    return () => clearTimeout(t);
  }, [value]);

  // Dışarı tıklanınca kapan
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const products = useQuery({
    queryKey: queryKeys.products({ q: term.trim(), pageSize: MAX_PRODUCTS }),
    queryFn: ({ signal }) => api.catalog.products({ q: term.trim(), pageSize: MAX_PRODUCTS }, { signal }),
    enabled: open && searching,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const matched = useMemo(() => {
    if (!searching) return { categories: [], brands: [] };
    const rank = (kind: SearchSuggestion['kind'], max: number) =>
      suggestions
        .filter((s) => s.kind === kind)
        .map((s) => ({ s, score: score(s.label, folded) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || a.s.label.length - b.s.label.length)
        .slice(0, max)
        .map((x) => x.s);
    // Aynı adrese giden tekrarları at (ör. aynı ada sahip üst ve alt kategori)
    const seen = new Set<string>();
    const unique = (list: SearchSuggestion[]) => list.filter((s) => !seen.has(s.href) && seen.add(s.href));
    return { categories: unique(rank('category', MAX_CATEGORIES)), brands: unique(rank('brand', MAX_BRANDS)) };
  }, [suggestions, folded, searching]);

  const productItems = searching && products.data ? products.data.items : [];
  const allHref = `/urunler?q=${encodeURIComponent(term.trim())}${kategori ? `&kategori=${encodeURIComponent(kategori)}` : ''}`;

  const items: Item[] = [
    ...matched.categories.map((s) => ({ type: 'suggestion' as const, key: `c:${s.href}`, href: s.href, data: s })),
    ...matched.brands.map((s) => ({ type: 'suggestion' as const, key: `b:${s.href}`, href: s.href, data: s })),
    ...productItems.map((p) => ({ type: 'product' as const, key: `p:${p.id}`, href: productHref(p.id), data: p })),
    ...(searching ? [{ type: 'all' as const, key: 'all', href: allHref }] : []),
  ];
  const showList = open && searching;

  const go = (href: string) => {
    setOpen(false);
    setActive(-1);
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList || items.length === 0) {
      if (e.key === 'ArrowDown' && searching) setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      go(items[active].href);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  const optionId = (i: number) => `${listId}-opt-${i}`;
  let index = -1; // listedeki sıra (klavye ile gezinme için)

  const row = (item: Item, content: React.ReactNode) => {
    index += 1;
    const i = index;
    return (
      <li
        key={item.key}
        id={optionId(i)}
        role="option"
        aria-selected={active === i}
        onMouseEnter={() => setActive(i)}
        onMouseDown={(e) => e.preventDefault()} // input odağı kaybolmasın
        onClick={() => go(item.href)}
        className={`flex cursor-pointer items-center gap-3 px-4 py-2 text-sm ${active === i ? 'bg-gray-100' : ''}`}
      >
        {content}
      </li>
    );
  };

  return (
    <div
      ref={wrapRef}
      className="relative order-last w-full lg:order-none lg:mx-auto lg:max-w-[625px] lg:flex-1"
    >
      <Form
        action="/urunler"
        role="search"
        onSubmit={() => setOpen(false)}
        className="flex h-11 w-full overflow-hidden rounded-md border border-gray-300 focus-within:border-brand-700 lg:h-[38px]"
      >
        <label htmlFor="q" className="sr-only">
          Ürün ara
        </label>
        <input
          id="q"
          name="q"
          type="search"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
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
            {options.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-gray-500"
            strokeWidth={SW}
            aria-hidden
          />
        </div>

        <button
          type="submit"
          className="grid w-12 place-items-center bg-brand-900 text-white transition hover:bg-brand-700"
          aria-label="Ara"
        >
          <Search className="size-5" strokeWidth={SW} aria-hidden />
        </button>
      </Form>

      {showList && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl">
          <ul id={listId} role="listbox" aria-label="Arama önerileri" className="max-h-[70vh] overflow-y-auto py-1">
            {matched.categories.length > 0 && <GroupTitle>Kategoriler</GroupTitle>}
            {matched.categories.map((s) =>
              row(
                { type: 'suggestion', key: `c:${s.href}`, href: s.href, data: s },
                <>
                  <FolderOpen className="size-4 shrink-0 text-brand-700" strokeWidth={SW} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">
                    <Highlight text={s.label} term={folded} />
                  </span>
                  {s.hint && s.hint !== s.label && <span className="shrink-0 text-[11px] text-gray-400">{s.hint}</span>}
                </>,
              ),
            )}

            {matched.brands.length > 0 && <GroupTitle>Markalar</GroupTitle>}
            {matched.brands.map((s) =>
              row(
                { type: 'suggestion', key: `b:${s.href}`, href: s.href, data: s },
                <>
                  <Tag className="size-4 shrink-0 text-brand-700" strokeWidth={SW} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">
                    <Highlight text={s.label} term={folded} />
                  </span>
                </>,
              ),
            )}

            {(productItems.length > 0 || products.isFetching) && (
              <GroupTitle>
                Ürünler
                {products.isFetching && <Loader2 className="ml-1.5 inline size-3 animate-spin" aria-hidden />}
              </GroupTitle>
            )}
            {productItems.map((p) =>
              row(
                { type: 'product', key: `p:${p.id}`, href: productHref(p.id), data: p },
                <>
                  <span className="relative size-10 shrink-0 overflow-hidden rounded bg-gray-100">
                    {p.image && <Image src={productImageSrc(p.image)} unoptimized={isUploadedImage(p.image)} alt="" fill sizes="40px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">
                      <Highlight text={p.name} term={folded} />
                    </span>
                    <span className="block text-[11px] text-gray-500">{p.brand}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold">{formatTL(p.price)}</span>
                </>,
              ),
            )}

            {items.length === 1 && !products.isFetching && (
              <li className="px-4 py-3 text-sm text-gray-500">&quot;{term.trim()}&quot; ile eşleşen öneri yok.</li>
            )}

            {row(
              { type: 'all', key: 'all', href: allHref },
              <span className="flex w-full items-center gap-2 font-semibold text-brand-900">
                <Search className="size-4" strokeWidth={SW} aria-hidden />
                &quot;{term.trim()}&quot; için tüm sonuçlar
                {products.data && !products.isPlaceholderData && (
                  <span className="font-normal text-gray-500">({products.data.total})</span>
                )}
              </span>,
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <li role="presentation" className="px-4 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
      {children}
    </li>
  );
}

/** Eşleşen kısmı kalın gösterir ("la" → **La**minat) */
function Highlight({ text, term }: { text: string; term: string }) {
  const at = term ? fold(text).indexOf(term) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <strong className="font-semibold text-brand-900">{text.slice(at, at + term.length)}</strong>
      {text.slice(at + term.length)}
    </>
  );
}
