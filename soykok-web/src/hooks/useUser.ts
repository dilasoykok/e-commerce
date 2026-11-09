'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/endpoints';
import { isAdmin, userFromResponse } from '@/lib/auth';
import { queryKeys } from '@/lib/query/keys';

/**
 * Giriş yapmış kullanıcı (GET /api/auth/user). Eski store/session.js'in yerine.
 *
 *   const { user, isLoggedIn, isAdmin, isLoading } = useUser();
 *
 * Aynı sayfadaki tüm bileşenler tek isteği paylaşır; 5 dk boyunca tekrar sorulmaz.
 * Giriş/çıkış tam sayfa yönlendirmesiyle olduğu için önbellek kendiliğinden sıfırlanır.
 */
export function useUser() {
  const query = useQuery({
    queryKey: queryKeys.user,
    queryFn: async ({ signal }) => userFromResponse(await api.auth.user({ signal })),
    staleTime: 5 * 60_000,
  });

  const user = query.data ?? null;
  return {
    user,
    isLoggedIn: Boolean(user),
    isAdmin: isAdmin(user),
    isLoading: query.isPending,
    error: query.error,
  };
}
