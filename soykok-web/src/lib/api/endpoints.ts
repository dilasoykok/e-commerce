/**
 * Backend uç noktaları — tek liste. Yeni bir uç nokta eklendiğinde buraya
 * bir fonksiyon eklenir; sayfalar ve hook'lar yalnızca bunları kullanır.
 *
 *   Auth     GET  /api/auth/user                (+ login/register/logout yönlendirmeleri: lib/auth.ts)
 *   Katalog  GET  /api/categories
 *            GET  /api/products?q=&kategori=&marka=&min=&max=&indirim=1&sirala=&page=&pageSize=
 *            GET  /api/products/{id}
 *   Sipariş  POST /api/orders · POST /api/orders/track · GET /api/me/orders · GET /api/me/orders/{number}
 *   Admin    POST /api/products · PUT /api/products/{id} · DELETE /api/products/{id}
 *            GET /api/admin/orders · GET /api/admin/orders/{number} · POST /api/admin/orders/{number}/status
 *            GET|POST /api/admin/categories · PUT|DELETE /api/admin/categories/{slug}
 *            POST /api/admin/category-groups · PUT|DELETE /api/admin/category-groups/{slug}
 *   Sistem   GET  /api/health · GET /api/me
 */

import { apiFetch, toQueryString, type ApiRequestInit } from './client';
import type {
  AdminCategoryList,
  SaveCategoryGroupInput,
  SaveCategoryInput,
  AdminOrderDetail,
  AdminOrderPage,
  AdminOrderQuery,
  AuthUserResponse,
  CatalogCategories,
  CreateProductInput,
  OrderDetail,
  OrderStatus,
  OrderSummary,
  PlaceOrderInput,
  ProductDetail,
  ProductInput,
  ProductPage,
  ProductQuery,
} from '@/lib/types';

type Opts = Pick<ApiRequestInit, 'cookie' | 'next' | 'signal' | 'cache'>;

export const api = {
  auth: {
    /** Giriş durumu (giriş yoksa da 200 döner) */
    user: (opts?: Opts) => apiFetch<AuthUserResponse>('/auth/user', { cache: 'no-store', ...opts }),
  },

  catalog: {
    categories: (opts?: Opts) => apiFetch<CatalogCategories>('/categories', opts),

    products: (query: ProductQuery = {}, opts?: Opts) =>
      apiFetch<ProductPage>(`/products${toQueryString(query)}`, opts),

    product: (id: string, opts?: Opts) => apiFetch<ProductDetail>(`/products/${encodeURIComponent(id)}`, opts),
  },

  orders: {
    /** Sipariş ver (misafir ya da üye). Fiyat ve kargo ücreti sunucuda hesaplanır. */
    place: (input: PlaceOrderInput) => apiFetch<OrderDetail>('/orders', { method: 'POST', json: input, timeoutMs: 20_000 }),

    /** Misafir sipariş takibi: numara + siparişte kullanılan e-posta */
    track: (number: string, email: string) =>
      apiFetch<OrderDetail>('/orders/track', { method: 'POST', json: { number, email } }),

    /** Giriş yapmış üyenin siparişleri */
    mine: (opts?: Opts) => apiFetch<OrderSummary[]>('/me/orders', { cache: 'no-store', ...opts }),
    mineOne: (number: string, opts?: Opts) =>
      apiFetch<OrderDetail>(`/me/orders/${encodeURIComponent(number)}`, { cache: 'no-store', ...opts }),
  },

  /** Yalnızca admin rolü (backend AdminPolicy) */
  admin: {
    createProduct: (input: CreateProductInput) =>
      apiFetch<ProductDetail>('/products', { method: 'POST', json: input }),

    updateProduct: (id: string, input: ProductInput) =>
      apiFetch<ProductDetail>(`/products/${encodeURIComponent(id)}`, { method: 'PUT', json: input }),

    deleteProduct: (id: string) => apiFetch<void>(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),

    /** Sipariş yönetimi */
    orders: (query: AdminOrderQuery = {}, opts?: Opts) =>
      apiFetch<AdminOrderPage>(`/admin/orders${toQueryString(query)}`, { cache: 'no-store', ...opts }),
    order: (number: string, opts?: Opts) =>
      apiFetch<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(number)}`, { cache: 'no-store', ...opts }),
    changeOrderStatus: (number: string, status: OrderStatus, note?: string) =>
      apiFetch<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(number)}/status`, {
        method: 'POST',
        json: { status, note: note || null },
      }),

    /** Kategori yönetimi — her işlem güncel listeyi döner */
    categories: (opts?: Opts) => apiFetch<AdminCategoryList>('/admin/categories', { cache: 'no-store', ...opts }),
    createCategory: (input: SaveCategoryInput) =>
      apiFetch<AdminCategoryList>('/admin/categories', { method: 'POST', json: input }),
    updateCategory: (slug: string, input: SaveCategoryInput) =>
      apiFetch<AdminCategoryList>(`/admin/categories/${encodeURIComponent(slug)}`, { method: 'PUT', json: input }),
    deleteCategory: (slug: string) =>
      apiFetch<AdminCategoryList>(`/admin/categories/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
    createCategoryGroup: (input: SaveCategoryGroupInput) =>
      apiFetch<AdminCategoryList>('/admin/category-groups', { method: 'POST', json: input }),
    updateCategoryGroup: (slug: string, input: SaveCategoryGroupInput) =>
      apiFetch<AdminCategoryList>(`/admin/category-groups/${encodeURIComponent(slug)}`, { method: 'PUT', json: input }),
    deleteCategoryGroup: (slug: string) =>
      apiFetch<AdminCategoryList>(`/admin/category-groups/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
  },

  system: {
    health: () =>
      apiFetch<{ status: 'ok' | 'degraded'; postgres: boolean; redis: boolean; rabbitmq: boolean }>('/health', {
        cache: 'no-store',
      }),
  },
};
