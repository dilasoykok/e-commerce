/**
 * Menü verisi. Eskiden aynı linkler header.html (mega menü), mobile-menu.html
 * ve footer.html'de ayrı ayrı yazılıydı; artık tek yerde.
 */

import type { LucideIcon } from 'lucide-react';
import { Layers, Ruler, FlaskConical, LayoutGrid, BrickWall, Building2, Sofa, Boxes } from 'lucide-react';

export type NavLink = { href: string; label: string };

export type CategoryNav = NavLink & {
  icon: LucideIcon;
  /** Alt panelin başlığı (yoksa label) */
  panelTitle?: string;
  children?: NavLink[];
  brands?: NavLink[];
};

const cat = (slug: string) => `/urunler?kategori=${slug}`;
const brand = (name: string) => `/urunler?marka=${encodeURIComponent(name)}`;

export const CATEGORY_NAV: CategoryNav[] = [
  {
    label: 'Parke',
    panelTitle: 'Parke Çeşitleri',
    href: cat('parke'),
    icon: Layers,
    children: [
      { href: cat('laminat'), label: 'Laminat Parke' },
      { href: cat('masif'), label: 'Masif Parke' },
      { href: cat('vinil'), label: 'Vinil Parke' },
      { href: cat('spc'), label: 'SPC Parke' },
      { href: cat('lvt'), label: 'LVT Parke' },
      { href: cat('deck'), label: 'Deck (Dış Mekan)' },
    ],
    brands: [
      { href: brand('Krono Original'), label: 'Krono Original' },
      { href: brand('Classen'), label: 'Classen' },
      { href: brand('Egger'), label: 'Egger' },
      { href: brand('Parador'), label: 'Parador' },
      { href: brand('Quick-Step'), label: 'Quick-Step' },
    ],
  },
  {
    label: 'Aksesuarlar',
    href: cat('aksesuar'),
    icon: Ruler,
    children: [
      { href: cat('supurgelik'), label: 'Süpürgelik' },
      { href: cat('profil'), label: 'Profil' },
      { href: cat('dis-kose'), label: 'Dış Köşe' },
      { href: cat('tamamlayici'), label: 'Tamamlayıcılar' },
    ],
  },
  {
    label: 'Yapı Kimyasalları',
    href: cat('kimyasal'),
    icon: FlaskConical,
    children: [
      { href: cat('yapistirici'), label: 'Yapıştırıcı' },
      { href: cat('derz'), label: 'Derz' },
      { href: cat('su-yalitimi'), label: 'Su Yalıtımı' },
    ],
  },
  { label: 'Zemin Kaplama Ürünleri', href: cat('zemin'), icon: LayoutGrid },
  { label: 'Duvar Kaplama', href: cat('duvar'), icon: BrickWall },
  { label: 'İnşaat Malzemeleri', href: cat('insaat'), icon: Building2 },
  { label: 'Dekorasyon Ürünleri', href: cat('dekorasyon'), icon: Sofa },
  { label: 'Markalar', href: '/#markalar', icon: Boxes },
];

/** Arama kutusundaki kategori seçenekleri */
export const SEARCH_CATEGORIES = [
  { value: '', label: 'Tüm Kategoriler' },
  { value: 'parke', label: 'Parke' },
  { value: 'aksesuar', label: 'Aksesuarlar' },
  { value: 'kimyasal', label: 'Yapı Kimyasalları' },
  { value: 'zemin', label: 'Zemin Kaplama' },
  { value: 'duvar', label: 'Duvar Kaplama' },
  { value: 'insaat', label: 'İnşaat Malzemeleri' },
  { value: 'dekorasyon', label: 'Dekorasyon Ürünleri' },
];

export const MAIN_NAV: NavLink[] = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/urunler?sirala=populer', label: 'Çok Satanlar' },
  { href: '#', label: 'Projeler' },
  { href: '#', label: 'Blog' },
];

export const TOPBAR_NAV: NavLink[] = [
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/magazalarimiz', label: 'Mağazalarımız' },
  { href: '/iletisim', label: 'İletişim' },
  { href: '/siparislerim', label: 'Sipariş Takibi' },
];

export const ACCOUNT_HREF = '/hesap#giris';
export const ORDERS_HREF = '/siparislerim';
