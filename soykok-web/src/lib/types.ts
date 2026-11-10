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

/* ---------- Siparişler (backend: Soykok.Application/Ordering/Contracts) ---------- */

export type OrderStatus = 'awaitingPayment' | 'received' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
export type DeliveryMethod = 'cargo' | 'store';
export type PaymentMethod = 'card' | 'transfer';

/** POST /api/orders gövdesi. Fiyat gönderilmez; sunucu katalogdan hesaplar. */
export type PlaceOrderInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  delivery: DeliveryMethod;
  city?: string;
  district?: string;
  address?: string;
  postalCode?: string;
  note?: string;
  invoiceType: 'individual' | 'corporate';
  companyName?: string;
  taxOffice?: string;
  taxNumber?: string;
  payment: PaymentMethod;
  marketing: boolean;
  terms: boolean;
  items: { productId: string; quantity: number }[];
};

export type OrderItem = {
  productId: string;
  productName: string;
  brand: string;
  image: string;
  unit: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderSummary = {
  number: string;
  status: OrderStatus;
  placedAt: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  itemCount: number;
  total: number;
  items: OrderItem[];
};

export type OrderDetail = {
  number: string;
  status: OrderStatus;
  placedAt: string;
  buyerFirstName: string;
  buyerLastName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  deliveryMethod: DeliveryMethod;
  shippingAddress: { city: string; district: string; line: string | null; postalCode: string | null } | null;
  deliveryNote: string | null;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingFee: number;
  total: number;
  items: OrderItem[];
  statusHistory: { status: OrderStatus; changedAt: string; note: string | null }[];
};

/* ---------- Sipariş yönetimi (admin) ---------- */

export type AdminOrderRow = {
  number: string;
  status: OrderStatus;
  placedAt: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  isMember: boolean;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  city: string | null;
  itemCount: number;
  total: number;
};

export type AdminOrderPage = { total: number; page: number; pageSize: number; items: AdminOrderRow[] };

export type AdminOrderDetail = {
  order: OrderDetail;
  invoice: { type: 'individual' | 'corporate'; companyName: string | null; taxOffice: string | null; taxNumber: string | null };
  isMember: boolean;
  marketingConsent: boolean;
  /** Bu durumdan geçilebilecek durumlar */
  nextStatuses: OrderStatus[];
};

export type AdminOrderQuery = { durum?: OrderStatus | ''; q?: string; page?: number; pageSize?: number };
