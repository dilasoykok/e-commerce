import type { AdminOrderQuery, ProductQuery } from '@/lib/types';

/**
 * TanStack Query anahtarları — tek yerde. Önbellek bu anahtarlarla tutulur ve
 * yenilenir (invalidate). Hiyerarşik: ['catalog'] yenilenirse altındaki tüm
 * ürün ve kategori sorguları da yenilenir.
 */
export const queryKeys = {
  user: ['auth', 'user'] as const,

  myOrders: ['orders', 'mine'] as const,
  myOrder: (number: string) => ['orders', 'mine', number] as const,

  adminOrdersAll: ['admin', 'orders'] as const,
  adminOrders: (query: AdminOrderQuery) => ['admin', 'orders', 'list', query] as const,
  adminOrder: (number: string) => ['admin', 'orders', 'detail', number] as const,

  adminMessagesAll: ['admin', 'messages'] as const,
  adminMessages: (query: { okunmamis?: boolean; page?: number }) => ['admin', 'messages', query] as const,

  adminReviewsAll: ['admin', 'reviews'] as const,
  adminReviews: (query: { durum?: string; page?: number }) => ['admin', 'reviews', query] as const,

  reviews: (productId: string, page: number) => ['reviews', productId, page] as const,
  reviewsOf: (productId: string) => ['reviews', productId] as const,

  catalog: ['catalog'] as const,
  categories: ['catalog', 'categories'] as const,
  adminCategories: ['catalog', 'admin-categories'] as const,
  products: (query: ProductQuery = {}) => ['catalog', 'products', query] as const,
  product: (id: string) => ['catalog', 'product', id] as const,
};
