'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import type { PlaceOrderInput } from '@/lib/types';

/** Misafir sipariş takibi (numara + e-posta) */
export function useTrackOrder() {
  return useMutation({
    mutationFn: ({ number, email }: { number: string; email: string }) => api.orders.track(number, email),
  });
}

/**
 * Sipariş ver. Başarılı olunca üyenin sipariş listesi ve katalog (satış adetleri)
 * yenilenir; sepeti boşaltmak çağıranın işidir (onay sayfasına geçmeden önce).
 */
export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceOrderInput) => api.orders.place(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myOrders });
      qc.invalidateQueries({ queryKey: queryKeys.catalog });
    },
  });
}
