/**
 * Ürün tipleri. Alan adları backend'deki ProductListItem / ProductDetail
 * (Soykok.Application/Catalog/Contracts) ile birebir aynı.
 */

export type BadgeType = 'sale' | 'new' | 'info';

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit?: string | null; // verilmezse m²
  image: string; // public/images/products altındaki dosya adı
  price: number;
  oldPrice: number | null;
  rating: number;
  reviews: number;
  badge: string | null;
  badgeType: BadgeType | string | null;
  addedAt: string; // YYYY-MM-DD
  sales: number;
  sortOrder?: number;
};

export type ProductDetailExtra = {
  boxM2: number | null;
  images?: string[];
  description: string;
  features: string[];
  specs: Record<string, string>;
};

export type ProductPage = {
  total: number;
  page: number;
  pageSize: number;
  items: Product[];
};

/** GET /api/products/{id} */
export type ProductDetail = Product & {
  boxM2: number | null;
  images: string[];
  description: string | null;
  features: string[];
  specs: Record<string, string>;
};

/** POST /api/products gövdesi (id isteğe bağlı) ve PUT /api/products/{id} gövdesi */
export type ProductInput = {
  name: string;
  brand: string;
  category: string;
  unit: string | null;
  image: string;
  price: number;
  oldPrice: number | null;
  badge: string | null;
  badgeType: BadgeType | null;
  boxM2: number | null;
  images: string[];
  description: string | null;
  features: string[];
  specs: Record<string, string>;
};

export type CreateProductInput = ProductInput & { id?: string | null };

/** GET /api/categories */
export type CatalogCategories = {
  categories: { slug: string; name: string }[];
  groups: { slug: string; label: string; categories: string[] }[];
};

/** GET /api/products sorgu parametreleri (adlar API ile aynı) */
export type ProductQuery = {
  q?: string;
  kategori?: string;
  marka?: string;
  min?: number;
  max?: number;
  indirim?: boolean;
  sirala?: 'onerilen' | 'populer' | 'yeni' | 'fiyat-artan' | 'fiyat-azalan' | 'puan';
  page?: number;
  pageSize?: number;
};

/* ---------- Oturum ---------- */

/** Backend'deki UserInfo (Soykok.Api/Auth/UserInfo.cs) */
export type ApiUser = {
  id: string | null;
  username: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  roles: string[];
};

/** GET /api/auth/user */
export type AuthUserResponse = { authenticated: true; user: ApiUser } | { authenticated: false };

/** Sitede kullanılan kullanıcı biçimi */
export type User = {
  id: string | null;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
};
