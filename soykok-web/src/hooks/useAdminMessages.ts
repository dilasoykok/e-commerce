'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';

/** GET /api/admin/messages — okunmamış sayısı da döner (sekmedeki rozet) */
export function useAdminMessages(query: { okunmamis?: boolean; page?: number }) {
  return useQuery({
    queryKey: queryKeys.adminMessages(query),
    queryFn: ({ signal }) => api.admin.messages({ ...query, pageSize: 20 }, { signal }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000, // açık panelde yeni mesajlar dakikada bir gelir
  });
}

/** Sekmedeki okunmamış rozeti için hafif sorgu */
export function useUnreadMessageCount() {
  const q = useQuery({
    queryKey: queryKeys.adminMessages({ okunmamis: true, page: 1 }),
    queryFn: ({ signal }) => api.admin.messages({ okunmamis: true, pageSize: 20 }, { signal }),
    refetchInterval: 60_000,
  });
  return q.data?.unread ?? 0;
}

export function useMarkMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => api.admin.markMessage(id, read),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminMessagesAll }),
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.deleteMessage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminMessagesAll }),
  });
}
