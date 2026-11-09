'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';

/**
 * TanStack Query — tarayıcıda API'den gelen veriler (server state) için önbellek.
 * Zustand yalnızca tarayıcıya ait durum (sepet, favoriler, çekmeceler) için kalır.
 */
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000, // 1 dk içinde aynı veri tekrar istenmez
            refetchOnWindowFocus: false,
            // 4xx hatalarında (yetki yok, bulunamadı...) tekrar deneme; ağ/5xx hatalarında 2 kez dene
            retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
          },
          mutations: { retry: false },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
