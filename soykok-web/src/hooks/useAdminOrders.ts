'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { revalidateCatalog } from '@/app/actions/catalog';
import type { AdminOrderQuery, OrderStatus } from '@/lib/types';

/** Admin sipariş listesi — sayfa/filtre değişirken eski liste ekranda kalır */
export function useAdminOrders(query: AdminOrderQuery) {
  return useQuery({
    queryKey: queryKeys.adminOrders(query),
    queryFn: ({ signal }) => api.admin.orders(query, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchInterval: 60_000, // yeni siparişler panel açıkken de görünsün
  });
}

export function useAdminOrder(number: string | null) {
  return useQuery({
    queryKey: queryKeys.adminOrder(number ?? ''),
    queryFn: ({ signal }) => api.admin.order(number!, { signal }),
    enabled: Boolean(number),
  });
}

/** Durum değiştir; liste ve detay yenilenir. İptalde stok/satış değiştiği için katalog da yenilenir. */
export function useChangeOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      number,
      status,
      note,
      shipment,
    }: {
      number: string;
      status: OrderStatus;
      note?: string;
      shipment?: { carrier: string; trackingNumber: string };
    }) => api.admin.changeOrderStatus(number, status, note, shipment),
    onSuccess: (detail, { status }) => {
      qc.setQueryData(queryKeys.adminOrder(detail.order.number), detail);
      qc.invalidateQueries({ queryKey: queryKeys.adminOrdersAll });
      if (status === 'cancelled') {
        qc.invalidateQueries({ queryKey: queryKeys.catalog });
        revalidateCatalog().catch(() => {});
      }
    },
  });
}
