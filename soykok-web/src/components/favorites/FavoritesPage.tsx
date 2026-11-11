'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQueries } from '@tanstack/react-query';
import { ArrowRight, Heart, Loader2 } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { useFavorites } from '@/store/favorites';

/**
 * Favori ürünler. Favoriler tarayıcıda (store/favorites.ts) ürün kodu olarak durur;
 * ürün bilgisi ve güncel fiyat API'den gelir. Satıştan kalkan ürün listeden düşer.
 * TODO: Üyeler için favoriler backend'e (customers.favorite_products) eşitlenebilir.
 */
export default function FavoritesPage() {
  const ids = useFavorites((s) => s.ids);
  const remove = useFavorites((s) => s.remove);

  // Favoriler localStorage'dan yüklenene kadar "boş" demeyelim
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(useFavorites.persist.hasHydrated());
    return useFavorites.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.product(id),
      queryFn: ({ signal }: { signal: AbortSignal }) => api.catalog.product(id, { signal }),
      enabled: hydrated,
    })),
  });

  // Silinmiş ürünleri favorilerden çıkar
  const missing = ids.filter((_, i) => results[i]?.error instanceof ApiError && (results[i].error as ApiError).isNotFound);
  useEffect(() => {
    if (missing.length) remove(missing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missing.join(',')]);

  if (!hydrated || results.some((r) => r.isPending)) {
    return (
      <div className="grid h-48 place-items-center">
        <Loader2 className="size-6 animate-spin text-gray-500" aria-label="Yükleniyor" />
      </div>
    );
  }

  const products = results.flatMap((r) => (r.data ? [r.data] : []));

  if (products.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center rounded-md border border-dashed border-gray-300 px-6 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-gray-100 text-gray-500">
          <Heart className="size-7" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="mt-4 font-semibold">Henüz favori ürününüz yok</p>
        <p className="mt-1 text-sm text-gray-500">Beğendiğiniz ürünlerdeki kalp simgesine dokunarak buraya ekleyin.</p>
        <Link
          href="/urunler"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Ürünlere Göz At <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-1 text-sm text-gray-500">{products.length} ürün</p>
      {results.some((r) => r.isError && !(r.error instanceof ApiError && r.error.isNotFound)) && (
        <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-900">Bazı ürünler şu an yüklenemedi.</p>
      )}
      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </ul>
    </>
  );
}
