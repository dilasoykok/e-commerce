'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import type { SaveAddressInput, SavedAddress } from '@/lib/types';

/** GET /api/me/addresses — yalnızca giriş yapılmışsa sorulur */
export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: queryKeys.addresses,
    queryFn: ({ signal }) => api.addresses.list({ signal }),
    enabled,
    staleTime: 5 * 60_000,
  });
}

/** Ekle / düzenle / sil / varsayılan yap: sunucu güncel listeyi döner, önbelleğe o yazılır */
function useAddressAction<V>(fn: (v: V) => Promise<SavedAddress[]>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (list) => qc.setQueryData(queryKeys.addresses, list),
  });
}

export const useCreateAddress = () => useAddressAction((input: SaveAddressInput) => api.addresses.create(input));
export const useUpdateAddress = () =>
  useAddressAction(({ id, input }: { id: string; input: SaveAddressInput }) => api.addresses.update(id, input));
export const useDeleteAddress = () => useAddressAction((id: string) => api.addresses.remove(id));
export const useMakeDefaultAddress = () => useAddressAction((id: string) => api.addresses.makeDefault(id));
