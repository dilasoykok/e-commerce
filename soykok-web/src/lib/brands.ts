import type { BrandInfo } from './types';

/**
 * Markalar artık YÖNETİM PANELİNDEN (Admin → Markalar) yönetilir: logo yükle/değiştir, ekle, sil, sırala.
 * Bu liste yalnızca API'ye ulaşılamadığında (ör. Docker kapalıyken `npm run dev`) kullanılan yedektir;
 * veritabanındaki ilk kayıtlar da buradaki markalar ve logolardır (migration AddBrands).
 */
export const BRANDS: BrandInfo[] = [
  { name: 'Filli Boya', logo: '/images/brands/filli-boya.png' },
  { name: 'Marshall', logo: '/images/brands/marshall.png' },
  { name: 'Dyo', logo: '/images/brands/dyo.png' },
  { name: 'Kalekim', logo: '/images/brands/kalekim.svg' },
  { name: 'Knauf', logo: '/images/brands/knauf.svg' },
  { name: 'Bosch', logo: '/images/brands/bosch.svg' },
  { name: 'Artema', logo: '/images/brands/artema.png' },
  { name: 'Akfix', logo: '/images/brands/akfix.svg' },
];

export const brandHref = (name: string) => `/urunler?marka=${encodeURIComponent(name)}`;
