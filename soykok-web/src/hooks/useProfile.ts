'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import type { UpdateProfileInput } from '@/lib/types';

/** GET /api/me/profile — yalnızca giriş yapılmışsa sorulur */
export function useProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: ({ signal }) => api.profile.get({ signal }),
    enabled,
    staleTime: 5 * 60_000,
  });
}

/** Kaydedince sunucunun döndürdüğü profil önbelleğe yazılır (tekrar sormaya gerek kalmaz) */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => api.profile.update(input),
    onSuccess: (profile) => {
      qc.setQueryData(queryKeys.profile, profile);
    },
  });
}
