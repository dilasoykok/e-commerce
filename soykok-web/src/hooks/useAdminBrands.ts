'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { revalidateCatalog } from '@/app/actions/catalog';
import type { AdminBrand, SaveBrandInput } from '@/lib/types';

/** GET /api/admin/brands — tüm markalar (ürün sayılarıyla) */
export function useAdminBrands() {
  return useQuery({
    queryKey: queryKeys.adminBrands,
    queryFn: ({ signal }) => api.admin.brands({ signal }),
  });
}

/**
 * Her işlem güncel listeyi döner: ekrana hemen yazılır. Sunucudaki Next.js önbelleği de yenilenir,
 * ana sayfadaki marka bandı ve Hakkımızda hemen güncellenir (ad değiştiyse ürünler de).
 */
function useBrandMutation<V>(fn: (vars: V) => Promise<AdminBrand[]>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (list) => {
      qc.setQueryData(queryKeys.adminBrands, list);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['catalog', 'products'] }),
        revalidateCatalog().catch(() => {}),
      ]);
    },
  });
}

export const useSaveBrand = () =>
  useBrandMutation(({ slug, input }: { slug: string | null; input: SaveBrandInput }) =>
    slug ? api.admin.updateBrand(slug, input) : api.admin.createBrand(input));

export const useDeleteBrand = () => useBrandMutation((slug: string) => api.admin.deleteBrand(slug));

/** Logo yükle → { url: "/api/files/brands/xxx.png" } */
export function useUploadBrandLogo() {
  return useMutation({ mutationFn: (file: File) => api.admin.uploadImage(file, 'brands') });
}
