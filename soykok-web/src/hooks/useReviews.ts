'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { revalidateCatalog } from '@/app/actions/catalog';
import { api } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import type { WriteReviewInput } from '@/lib/types';

/* ---------- Site ---------- */

/** GET /api/products/{id}/reviews — onaylı yorumlar, özet ve (giriş yapılmışsa) kendi yorumu */
export function useProductReviews(productId: string, page: number) {
  return useQuery({
    queryKey: queryKeys.reviews(productId, page),
    queryFn: ({ signal }) => api.reviews.list(productId, page, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useWriteReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WriteReviewInput) => api.reviews.write(productId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.reviewsOf(productId) }),
  });
}

/* ---------- Admin ---------- */

type AdminQuery = { durum?: 'bekleyen' | 'onayli'; page?: number };

export function useAdminReviews(query: AdminQuery) {
  return useQuery({
    queryKey: queryKeys.adminReviews(query),
    queryFn: ({ signal }) => api.admin.reviews(query, { signal }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

/** Sekmedeki "onay bekleyen" rozeti */
export function usePendingReviewCount() {
  const q = useQuery({
    queryKey: queryKeys.adminReviews({ durum: 'bekleyen', page: 1 }),
    queryFn: ({ signal }) => api.admin.reviews({ durum: 'bekleyen', page: 1 }, { signal }),
    refetchInterval: 60_000,
  });
  return q.data?.pending ?? 0;
}

/** Onay/silme ürünün puanını değiştirir → katalog önbelleği de yenilenir */
function useReviewAction(fn: (id: string) => Promise<void>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.adminReviewsAll }),
        qc.invalidateQueries({ queryKey: ['reviews'] }),
        qc.invalidateQueries({ queryKey: queryKeys.catalog }),
        revalidateCatalog().catch(() => {}),
      ]),
  });
}

export const useApproveReview = () => useReviewAction(api.admin.approveReview);
export const useDeleteReview = () => useReviewAction(api.admin.deleteReview);
