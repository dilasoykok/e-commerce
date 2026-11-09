import type { ProductQuery } from '@/lib/types';

/**
 * TanStack Query anahtarları — tek yerde. Önbellek bu anahtarlarla tutulur ve
 * yenilenir (invalidate). Hiyerarşik: ['catalog'] yenilenirse altındaki tüm
 * ürün ve kategori sorguları da yenilenir.
 */
export const queryKeys = {
  user: ['auth', 'user'] as const,

  catalog: ['catalog'] as const,
  categories: ['catalog', 'categories'] as const,
  products: (query: ProductQuery = {}) => ['catalog', 'products', query] as const,
  product: (id: string) => ['catalog', 'product', id] as const,
};
