/**
 * Menü verisi. Eskiden aynı linkler header.html (mega menü), mobile-menu.html
 * ve footer.html'de ayrı ayrı yazılıydı; artık tek yerde.
 */

export type NavLink = { href: string; label: string };

// Kategori menüsü artık veritabanından üretilir: lib/category-nav.ts

export const MAIN_NAV: NavLink[] = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/urunler?sirala=populer', label: 'Çok Satanlar' },
  { href: '/urunler?indirim=1', label: 'Kampanyalar' },
  { href: '/magazalarimiz', label: 'Mağazamız' },
];

export const TOPBAR_NAV: NavLink[] = [
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/magazalarimiz', label: 'Mağazalarımız' },
  { href: '/iletisim', label: 'İletişim' },
  { href: '/siparislerim', label: 'Sipariş Takibi' },
];

export const ACCOUNT_HREF = '/hesap#giris';
export const ORDERS_HREF = '/siparislerim';
