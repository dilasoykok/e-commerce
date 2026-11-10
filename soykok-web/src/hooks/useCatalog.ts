'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query/keys';
import { revalidateCatalog } from '@/app/actions/catalog';
import type { CreateProductInput, ProductInput, ProductQuery } from '@/lib/types';

/*
 * Katalog verisi — TARAYICIDA değişen durumlar için (admin paneli, ileride
 * canlı filtreleme). Sayfaların ilk çizimi Server Component + lib/catalog.ts ile yapılır.
 */

/** GET /api/categories */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: ({ signal }) => api.catalog.categories({ signal }),
    staleTime: 10 * 60_000,
  });
}

/** GET /api/products — sayfa değişirken eski liste ekranda kalır (titreme olmaz) */
export function useProducts(query: ProductQuery) {
  return useQuery({
    queryKey: queryKeys.products(query),
    queryFn: ({ signal }) => api.catalog.products(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

/** GET /api/products/{id} — id yoksa istek atılmaz */
export function useProduct(id: string | null) {
  return useQuery({
    queryKey: queryKeys.product(id ?? ''),
    queryFn: ({ signal }) => api.catalog.product(id!, { signal }),
    enabled: Boolean(id),
  });
}

/* ---------- Admin: ekle / güncelle / sil ---------- */

/**
 * Başarılı her değişiklikten sonra:
 *  1. Tarayıcıdaki tüm katalog sorguları yenilenir (['catalog'] altı)
 *  2. Sunucudaki Next.js önbelleği ("catalog" etiketi) temizlenir → ana sayfa
 *     ve ürün sayfaları beklemeden yeni veriyi gösterir
 */
function useCatalogInvalidation() {
  const qc = useQueryClient();
  return async () => {
    await Promise.all([qc.invalidateQueries({ queryKey: queryKeys.catalog }), revalidateCatalog().catch(() => {})]);
  };
}

export function useCreateProduct() {
  const invalidate = useCatalogInvalidation();
  return useMutation({
    mutationFn: (input: CreateProductInput) => api.admin.createProduct(input),
    onSuccess: invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useCatalogInvalidation();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductInput }) => api.admin.updateProduct(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useCatalogInvalidation();
  return useMutation({
    mutationFn: (id: string) => api.admin.deleteProduct(id),
    onSuccess: invalidate,
  });
}

/** Ürün görseli yükle (yalnızca admin). Dönen adres ürünün image/images alanına yazılır. */
export function useUploadImage() {
  return useMutation({ mutationFn: (file: File) => api.admin.uploadImage(file) });
}
