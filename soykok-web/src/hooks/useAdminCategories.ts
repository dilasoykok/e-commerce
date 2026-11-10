'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { revalidateCatalog } from '@/app/actions/catalog';
import type { AdminCategoryList, SaveCategoryGroupInput, SaveCategoryInput } from '@/lib/types';

/** GET /api/admin/categories — alt kategoriler (ürün sayılarıyla) + üst kategoriler */
export function useAdminCategories() {
  return useQuery({
    queryKey: queryKeys.adminCategories,
    queryFn: ({ signal }) => api.admin.categories({ signal }),
  });
}

/**
 * Her işlem güncel listeyi döner: ekrana hemen yazılır. Ardından tarayıcıdaki katalog
 * sorguları ve sunucudaki Next.js önbelleği yenilenir → menü, filtreler, ürün formu güncellenir.
 */
function useCategoryMutation<V>(fn: (vars: V) => Promise<AdminCategoryList>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (list) => {
      qc.setQueryData(queryKeys.adminCategories, list);
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.categories }),
        qc.invalidateQueries({ queryKey: ['catalog', 'products'] }),
        revalidateCatalog().catch(() => {}),
      ]);
    },
  });
}

export const useSaveCategory = () =>
  useCategoryMutation(({ slug, input }: { slug: string | null; input: SaveCategoryInput }) =>
    slug ? api.admin.updateCategory(slug, input) : api.admin.createCategory(input));

export const useDeleteCategory = () => useCategoryMutation((slug: string) => api.admin.deleteCategory(slug));

export const useSaveCategoryGroup = () =>
  useCategoryMutation(({ slug, input }: { slug: string | null; input: SaveCategoryGroupInput }) =>
    slug ? api.admin.updateCategoryGroup(slug, input) : api.admin.createCategoryGroup(input));

export const useDeleteCategoryGroup = () => useCategoryMutation((slug: string) => api.admin.deleteCategoryGroup(slug));
