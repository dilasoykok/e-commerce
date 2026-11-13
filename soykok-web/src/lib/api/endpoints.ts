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
 *   Yorum    GET|POST /api/products/{id}/reviews · GET /api/admin/reviews · POST /api/admin/reviews/{id}/approve · DELETE /api/admin/reviews/{id}
 *   Hesap    GET|PUT /api/me/profile · GET|POST /api/me/addresses · PUT|DELETE /api/me/addresses/{id} · POST /api/me/addresses/{id}/default
 *   Marka    GET /api/brands · GET|POST /api/admin/brands · PUT|DELETE /api/admin/brands/{slug}
 *   Sistem   GET  /api/health · GET /api/me
 */

import { apiFetch, toQueryString, type ApiRequestInit } from './client';
import type {
  AdminBrand,
  BrandInfo,
  SaveBrandInput,
  AdminReviewPage,
  SaveAddressInput,
  SavedAddress,
  Profile,
  UpdateProfileInput,
  InstallmentInfo,
  ProductReviews,
  WriteReviewInput,
  ContactInput,
  ContactMessage,
  ContactMessagePage,
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
    /** Sitede gösterilen markalar (admin → Markalar'dan yönetilir) */
    brands: (opts?: Opts) => apiFetch<BrandInfo[]>('/brands', opts),
  },

  reviews: {
    /** Onaylı yorumlar + özet; giriş yapmışsa kendi yorumu (onay bekliyor olabilir) */
    list: (productId: string, page = 1, opts?: Opts) =>
      apiFetch<ProductReviews>(`/products/${encodeURIComponent(productId)}/reviews${toQueryString({ page })}`, {
        cache: 'no-store',
        ...opts,
      }),
    /** Yorum yaz ya da kendi yorumunu düzenle (yeniden onaya düşer) */
    write: (productId: string, input: WriteReviewInput) =>
      apiFetch<ProductReviews['myReview']>(`/products/${encodeURIComponent(productId)}/reviews`, { method: 'POST', json: input }),
  },

  contact: {
    /** POST /api/contact — iletişim formu (IP başına 10 dakikada 5 mesaj) */
    send: (input: ContactInput) => apiFetch<{ received: boolean }>('/contact', { method: 'POST', json: input }),
  },

  profile: {
    /** Giriş yapan üyenin profili (kaydı yoksa Keycloak bilgileriyle doldurulur) */
    get: (opts?: Opts) => apiFetch<Profile>('/me/profile', { cache: 'no-store', ...opts }),
    update: (input: UpdateProfileInput) => apiFetch<Profile>('/me/profile', { method: 'PUT', json: input }),
  },

  addresses: {
    /** Kayıtlı adresler (varsayılan en üstte). Her işlem güncel listeyi döner. */
    list: (opts?: Opts) => apiFetch<SavedAddress[]>('/me/addresses', { cache: 'no-store', ...opts }),
    create: (input: SaveAddressInput) => apiFetch<SavedAddress[]>('/me/addresses', { method: 'POST', json: input }),
    update: (id: string, input: SaveAddressInput) =>
      apiFetch<SavedAddress[]>(`/me/addresses/${id}`, { method: 'PUT', json: input }),
    remove: (id: string) => apiFetch<SavedAddress[]>(`/me/addresses/${id}`, { method: 'DELETE' }),
    makeDefault: (id: string) => apiFetch<SavedAddress[]>(`/me/addresses/${id}/default`, { method: 'POST' }),
  },

  payments: {
    /** Tutar için kart ailelerine göre taksit seçenekleri (iyzico; sunucuda 6 saat önbellekte) */
    installments: (price: number, opts?: Opts) =>
      apiFetch<InstallmentInfo>(`/payments/installments${toQueryString({ price: price.toFixed(2) })}`, opts),
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
    changeOrderStatus: (
      number: string,
      status: OrderStatus,
      note?: string,
      shipment?: { carrier: string; trackingNumber: string },
    ) =>
      apiFetch<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(number)}/status`, {
        method: 'POST',
        json: { status, note: note || null, carrier: shipment?.carrier ?? null, trackingNumber: shipment?.trackingNumber ?? null },
      }),

    /** İletişim mesajları */
    messages: (query: { okunmamis?: boolean; page?: number; pageSize?: number } = {}, opts?: Opts) =>
      apiFetch<ContactMessagePage>(
        `/admin/messages${toQueryString({ okunmamis: query.okunmamis ? '1' : undefined, page: query.page, pageSize: query.pageSize })}`,
        { cache: 'no-store', ...opts },
      ),
    markMessage: (id: string, read: boolean) =>
      apiFetch<ContactMessage>(`/admin/messages/${id}/read`, { method: 'POST', json: { read } }),
    deleteMessage: (id: string) => apiFetch<void>(`/admin/messages/${id}`, { method: 'DELETE' }),

    /** Ürün yorumları (onay) */
    reviews: (query: { durum?: 'bekleyen' | 'onayli'; page?: number } = {}, opts?: Opts) =>
      apiFetch<AdminReviewPage>(`/admin/reviews${toQueryString({ durum: query.durum, page: query.page })}`, {
        cache: 'no-store',
        ...opts,
      }),
    approveReview: (id: string) => apiFetch<void>(`/admin/reviews/${id}/approve`, { method: 'POST' }),
    deleteReview: (id: string) => apiFetch<void>(`/admin/reviews/${id}`, { method: 'DELETE' }),

    /** Görsel yükleme → { url: "/api/files/products/xxx.jpg" } (marka logosu için klasor: 'brands') */
    uploadImage: (file: File, klasor: 'products' | 'brands' = 'products') => {
      const form = new FormData();
      form.append('file', file);
      return apiFetch<{ url: string }>(`/admin/uploads${toQueryString({ klasor: klasor === 'products' ? undefined : klasor })}`, {
        method: 'POST',
        form,
        timeoutMs: 60_000,
      });
    },

    /** Marka yönetimi — her işlem güncel listeyi döner */
    brands: (opts?: Opts) => apiFetch<AdminBrand[]>('/admin/brands', { cache: 'no-store', ...opts }),
    createBrand: (input: SaveBrandInput) => apiFetch<AdminBrand[]>('/admin/brands', { method: 'POST', json: input }),
    updateBrand: (slug: string, input: SaveBrandInput) =>
      apiFetch<AdminBrand[]>(`/admin/brands/${encodeURIComponent(slug)}`, { method: 'PUT', json: input }),
    deleteBrand: (slug: string) => apiFetch<AdminBrand[]>(`/admin/brands/${encodeURIComponent(slug)}`, { method: 'DELETE' }),

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
