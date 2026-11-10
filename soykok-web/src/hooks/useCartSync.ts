'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';
import { useCart, useCartHydrated } from '@/store/cart';

/**
 * Sepet sayfası açılınca sepetteki ürünlerin fiyat/ad bilgisini API'den tazeler.
 * Sepet tarayıcıda (localStorage) durduğu için eklendiği günkü fiyatı taşır;
 * fiyat değiştiyse ya da ürün kaldırıldıysa kullanıcıya bildirilir.
 *
 * (Ödemede tutarlar her durumda sunucuda yeniden hesaplanmalı — bu yalnızca
 * kullanıcının doğru fiyatı görmesi için.)
 */
export function useCartSync() {
  const hydrated = useCartHydrated();
  const ids = useCart((s) => s.items.map((i) => i.id).join(','));
  const syncProducts = useCart((s) => s.syncProducts);
  const [notice, setNotice] = useState<string | null>(null);

  const idList = useMemo(() => (ids ? ids.split(',') : []), [ids]);

  const results = useQueries({
    queries: idList.map((id) => ({
      queryKey: queryKeys.product(id),
      queryFn: ({ signal }: { signal: AbortSignal }) => api.catalog.product(id, { signal }),
      enabled: hydrated,
      staleTime: 30_000,
    })),
  });

  const done = hydrated && results.length > 0 && results.every((r) => !r.isPending);
  // Sonuçlar değişince bir kez eşitle (her çizimde değil)
  const signature = results.map((r) => `${r.dataUpdatedAt}:${r.errorUpdatedAt}`).join('|');

  useEffect(() => {
    if (!done) return;
    const fresh = results.flatMap((r) => (r.data ? [r.data] : []));
    const missing = idList.filter(
      (_, i) => results[i]?.error instanceof ApiError && (results[i].error as ApiError).isNotFound,
    );
    const { changed, removed } = syncProducts(
      fresh.map((p) => ({ id: p.id, name: p.name, brand: p.brand, image: p.image, price: p.price, unit: p.unit || 'm²' })),
      missing,
    );

    const parts: string[] = [];
    if (changed.length) parts.push(`Fiyatı güncellenen ürünler: ${changed.join(', ')}.`);
    if (removed.length) parts.push(`Satıştan kaldırıldığı için sepetten çıkarılanlar: ${removed.join(', ')}.`);
    if (parts.length) setNotice(parts.join(' '));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, signature]);

  return { hydrated, notice, dismiss: () => setNotice(null) };
}
