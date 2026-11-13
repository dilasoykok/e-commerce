'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';

/**
 * Tutar için taksit seçenekleri. Kartla ödeme kapalıysa ya da iyzico'ya ulaşılamazsa
 * `data.enabled` false / `cards` boş gelir; bileşenler o zaman hiçbir şey göstermez.
 */
export function useInstallments(price: number) {
  return useQuery({
    queryKey: queryKeys.installments(price),
    queryFn: ({ signal }) => api.payments.installments(price, { signal }),
    enabled: price > 0,
    staleTime: 30 * 60_000,
    retry: false,
  });
}
