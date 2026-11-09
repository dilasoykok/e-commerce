/**
 * Backend uç noktaları — tek liste. Yeni bir uç nokta eklendiğinde buraya
 * bir fonksiyon eklenir; sayfalar ve hook'lar yalnızca bunları kullanır.
 *
 *   Auth     GET  /api/auth/user                (+ login/register/logout yönlendirmeleri: lib/auth.ts)
 *   Katalog  GET  /api/categories
 *            GET  /api/products?q=&kategori=&marka=&min=&max=&indirim=1&sirala=&page=&pageSize=
 *            GET  /api/products/{id}
 *   Admin    POST /api/products · PUT /api/products/{id} · DELETE /api/products/{id}
 *   Sistem   GET  /api/health · GET /api/me
 */

import { apiFetch, toQueryString, type ApiRequestInit } from './client';
import type {
  AuthUserResponse,
  CatalogCategories,
  CreateProductInput,
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

  /** Yalnızca admin rolü (backend AdminPolicy) */
  admin: {
    createProduct: (input: CreateProductInput) =>
      apiFetch<ProductDetail>('/products', { method: 'POST', json: input }),

    updateProduct: (id: string, input: ProductInput) =>
      apiFetch<ProductDetail>(`/products/${encodeURIComponent(id)}`, { method: 'PUT', json: input }),

    deleteProduct: (id: string) => apiFetch<void>(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },

  system: {
    health: () =>
      apiFetch<{ status: 'ok' | 'degraded'; postgres: boolean; redis: boolean; rabbitmq: boolean }>('/health', {
        cache: 'no-store',
      }),
  },
};
