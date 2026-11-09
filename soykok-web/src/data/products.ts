import type { Product, ProductDetailExtra } from '@/lib/types';

/**
 * Ürün verisi (geçici).
 * Backend gelince bu dizi API'den gelecek; alan adları aynı kalırsa
 * listeleme sayfasında başka bir değişiklik gerekmez.
 *
 * price / oldPrice: TL (sayı). oldPrice yoksa null.
 * badge: kartın sol üstündeki etiket (yoksa null)
 * badgeType: 'sale' | 'new' | 'info'  → etiket rengi
 * addedAt: "Yeni Ürünler" sıralaması için ekleniş tarihi
 * sales: "Çok Satanlar" sıralaması için satış adedi
 * unit: fiyat birimi (verilmezse m²)
 */

export const CATEGORIES: Record<string, string> = {
  // Parke
  laminat: 'Laminat Parke',
  masif: 'Masif Parke',
  vinil: 'Vinil Parke',
  spc: 'SPC Parke',
  lvt: 'LVT Parke',
  deck: 'Deck (Dış Mekan)',
  // Aksesuarlar
  supurgelik: 'Süpürgelik',
  profil: 'Profil',
  'dis-kose': 'Dış Köşe',
  tamamlayici: 'Tamamlayıcılar',
  // Yapı kimyasalları
  yapistirici: 'Yapıştırıcı',
  derz: 'Derz',
  'su-yalitimi': 'Su Yalıtımı',
  // Diğer
  duvar: 'Duvar Kaplama',
  insaat: 'İnşaat Malzemeleri',
  dekorasyon: 'Dekorasyon Ürünleri',
};

/** ?kategori=parke gibi üst kategoriler → alt kategoriler */
export const CATEGORY_GROUPS: Record<string, string[]> = {
  parke: ['laminat', 'masif', 'vinil', 'spc', 'lvt', 'deck'],
  aksesuar: ['supurgelik', 'profil', 'dis-kose', 'tamamlayici'],
  kimyasal: ['yapistirici', 'derz', 'su-yalitimi'],
  zemin: ['laminat', 'masif', 'vinil', 'spc', 'lvt', 'deck', 'supurgelik', 'profil', 'dis-kose', 'tamamlayici'],
};

/** Üst kategorilerin sayfa başlığında görünen adları */
export const GROUP_LABELS: Record<string, string> = {
  parke: 'Parke Çeşitleri',
  aksesuar: 'Aksesuarlar',
  kimyasal: 'Yapı Kimyasalları',
  zemin: 'Zemin Kaplama Ürünleri',
};

export const PRODUCTS: Product[] = [
  // ---------- LAMİNAT PARKE ----------
  { id: 'p1', name: 'Laminat Parke - Oak Naturel 8mm', brand: 'Krono Original', category: 'laminat', image: 'laminat-oak-naturel.jpg', price: 1062, oldPrice: 1250, rating: 4.8, reviews: 124, badge: 'Çok Satan', badgeType: 'sale', addedAt: '2026-03-10', sales: 980 },
  { id: 'p6', name: 'Laminat Parke - Beyaz Meşe 10mm', brand: 'Classen', category: 'laminat', image: 'laminat-oak-naturel.jpg', price: 1290, oldPrice: null, rating: 4.7, reviews: 64, badge: null, badgeType: null, addedAt: '2026-08-14', sales: 390 },
  { id: 'p7', name: 'Laminat Parke - Antik Ceviz 8mm', brand: 'Egger', category: 'laminat', image: 'spc-mese.jpg', price: 980, oldPrice: 1150, rating: 4.4, reviews: 41, badge: '%15 İndirim', badgeType: 'sale', addedAt: '2026-02-01', sales: 620 },

  // ---------- MASİF PARKE ----------
  { id: 'p8', name: 'Masif Parke - Doğal Meşe 15mm', brand: 'Parador', category: 'masif', image: 'laminat-oak-naturel.jpg', price: 3450, oldPrice: null, rating: 4.9, reviews: 22, badge: null, badgeType: null, addedAt: '2026-07-07', sales: 95 },
  { id: 'p13', name: 'Masif Parke - Füme Meşe 14mm', brand: 'Parador', category: 'masif', image: 'spc-mese.jpg', price: 3890, oldPrice: 4290, rating: 4.8, reviews: 17, badge: '%9 İndirim', badgeType: 'sale', addedAt: '2026-09-18', sales: 60 },

  // ---------- VİNİL PARKE ----------
  { id: 'p2', name: 'Vinil Parke - Stone Grey 5mm', brand: 'Classen', category: 'vinil', image: 'vinil-stone-grey.jpg', price: 2850, oldPrice: null, rating: 4.9, reviews: 56, badge: 'Yeni', badgeType: 'new', addedAt: '2026-09-28', sales: 210 },
  { id: 'p10', name: 'Vinil Parke - Açık Meşe 4mm', brand: 'Quick-Step', category: 'vinil', image: 'spc-mese.jpg', price: 2390, oldPrice: 2690, rating: 4.7, reviews: 33, badge: '%11 İndirim', badgeType: 'sale', addedAt: '2026-09-02', sales: 180 },

  // ---------- SPC PARKE ----------
  { id: 'p3', name: 'SPC Parke - Meşe 4mm', brand: 'Egger', category: 'spc', image: 'spc-mese.jpg', price: 1580, oldPrice: 1755, rating: 4.6, reviews: 92, badge: '%10 İndirim', badgeType: 'sale', addedAt: '2026-06-02', sales: 540 },
  { id: 'p9', name: 'SPC Parke - Gri Taş Desen 5mm', brand: 'Quick-Step', category: 'spc', image: 'vinil-stone-grey.jpg', price: 1690, oldPrice: null, rating: 4.6, reviews: 48, badge: 'Yeni', badgeType: 'new', addedAt: '2026-10-05', sales: 120 },

  // ---------- LVT PARKE ----------
  { id: 'p4', name: 'LVT Parke - Balıksırtı 3mm', brand: 'Krono Original', category: 'lvt', image: 'lvt-baliksirti.jpg', price: 1701, oldPrice: 1890, rating: 4.8, reviews: 73, badge: 'Hızlı Teslimat', badgeType: 'info', addedAt: '2026-05-15', sales: 430 },
  { id: 'p14', name: 'LVT Parke - Karo Mermer 2,5mm', brand: 'Classen', category: 'lvt', image: 'vinil-stone-grey.jpg', price: 1490, oldPrice: null, rating: 4.5, reviews: 19, badge: null, badgeType: null, addedAt: '2026-08-01', sales: 140 },

  // ---------- DECK ----------
  { id: 'p5', name: 'Deck - Kompozit Ahşap 20mm', brand: 'WPC', category: 'deck', image: 'deck-kompozit.jpg', price: 1560, oldPrice: 1950, rating: 4.5, reviews: 38, badge: '%20 İndirim', badgeType: 'sale', addedAt: '2026-04-20', sales: 160 },
  { id: 'p15', name: 'Deck - Antrasit Kompozit 22mm', brand: 'WPC', category: 'deck', image: 'deck-kompozit.jpg', price: 1720, oldPrice: null, rating: 4.6, reviews: 21, badge: 'Yeni', badgeType: 'new', addedAt: '2026-09-25', sales: 75 },

  // ---------- SÜPÜRGELİK ----------
  { id: 'p11', name: 'Süpürgelik - Beyaz Lake 8cm', brand: 'Parador', category: 'supurgelik', unit: 'mt', image: 'vinil-stone-grey.jpg', price: 145, oldPrice: null, rating: 4.5, reviews: 112, badge: null, badgeType: null, addedAt: '2026-01-20', sales: 1450 },
  { id: 'p16', name: 'Süpürgelik - Meşe Desen 6cm', brand: 'Egger', category: 'supurgelik', unit: 'mt', image: 'laminat-oak-naturel.jpg', price: 98, oldPrice: 115, rating: 4.4, reviews: 58, badge: '%15 İndirim', badgeType: 'sale', addedAt: '2026-06-11', sales: 870 },

  // ---------- PROFİL ----------
  { id: 'p17', name: 'Geçiş Profili - Alüminyum Gümüş', brand: 'Parador', category: 'profil', unit: 'adet', image: 'vinil-stone-grey.jpg', price: 165, oldPrice: null, rating: 4.6, reviews: 34, badge: null, badgeType: null, addedAt: '2026-04-02', sales: 410 },
  { id: 'p18', name: 'Bitiş Profili - Meşe Desen', brand: 'Egger', category: 'profil', unit: 'adet', image: 'spc-mese.jpg', price: 135, oldPrice: null, rating: 4.3, reviews: 15, badge: null, badgeType: null, addedAt: '2026-07-19', sales: 190 },

  // ---------- DIŞ KÖŞE ----------
  { id: 'p19', name: 'Süpürgelik Dış Köşe - Beyaz', brand: 'Parador', category: 'dis-kose', unit: 'adet', image: 'vinil-stone-grey.jpg', price: 25, oldPrice: null, rating: 4.5, reviews: 47, badge: null, badgeType: null, addedAt: '2026-01-25', sales: 960 },
  { id: 'p20', name: 'Süpürgelik Dış Köşe - Meşe', brand: 'Egger', category: 'dis-kose', unit: 'adet', image: 'laminat-oak-naturel.jpg', price: 22, oldPrice: 28, rating: 4.4, reviews: 23, badge: 'İndirim', badgeType: 'sale', addedAt: '2026-06-15', sales: 520 },

  // ---------- TAMAMLAYICILAR ----------
  { id: 'p21', name: 'Parke Altı Şilte 2mm', brand: 'Krono Original', category: 'tamamlayici', image: 'lvt-baliksirti.jpg', price: 35, oldPrice: null, rating: 4.6, reviews: 88, badge: 'Çok Satan', badgeType: 'sale', addedAt: '2026-02-12', sales: 1600 },
  { id: 'p22', name: 'Nem Bariyeri Naylon 0,2mm', brand: 'Krono Original', category: 'tamamlayici', image: 'vinil-stone-grey.jpg', price: 18, oldPrice: null, rating: 4.4, reviews: 39, badge: null, badgeType: null, addedAt: '2026-03-03', sales: 1100 },

  // ---------- YAPIŞTIRICI ----------
  { id: 'p12', name: 'Parke Yapıştırıcısı 15kg', brand: 'Egger', category: 'yapistirici', unit: 'adet', image: 'deck-kompozit.jpg', price: 890, oldPrice: null, rating: 4.3, reviews: 27, badge: null, badgeType: null, addedAt: '2026-03-30', sales: 310 },
  { id: 'p23', name: 'LVT Yapıştırıcısı 12kg', brand: 'Classen', category: 'yapistirici', unit: 'adet', image: 'lvt-baliksirti.jpg', price: 760, oldPrice: 840, rating: 4.5, reviews: 18, badge: '%10 İndirim', badgeType: 'sale', addedAt: '2026-08-22', sales: 150 },

  // ---------- DERZ ----------
  { id: 'p24', name: 'Derz Dolgusu Gri 5kg', brand: 'Örnek Marka', category: 'derz', unit: 'adet', image: 'vinil-stone-grey.jpg', price: 210, oldPrice: null, rating: 4.4, reviews: 31, badge: null, badgeType: null, addedAt: '2026-05-05', sales: 280 },
  { id: 'p25', name: 'Derz Dolgusu Beyaz 5kg', brand: 'Örnek Marka', category: 'derz', unit: 'adet', image: 'vinil-stone-grey.jpg', price: 210, oldPrice: null, rating: 4.5, reviews: 26, badge: null, badgeType: null, addedAt: '2026-05-05', sales: 260 },

  // ---------- SU YALITIMI ----------
  { id: 'p26', name: 'Çimento Esaslı Su Yalıtımı 20kg', brand: 'Örnek Marka', category: 'su-yalitimi', unit: 'adet', image: 'deck-kompozit.jpg', price: 980, oldPrice: 1090, rating: 4.6, reviews: 22, badge: '%10 İndirim', badgeType: 'sale', addedAt: '2026-04-14', sales: 130 },
  { id: 'p27', name: 'Likit Membran 5kg', brand: 'Örnek Marka', category: 'su-yalitimi', unit: 'adet', image: 'vinil-stone-grey.jpg', price: 640, oldPrice: null, rating: 4.4, reviews: 14, badge: 'Yeni', badgeType: 'new', addedAt: '2026-10-01', sales: 45 },

  // ---------- DUVAR KAPLAMA ----------
  { id: 'p28', name: 'Ahşap Görünümlü Duvar Paneli', brand: 'Egger', category: 'duvar', image: 'laminat-oak-naturel.jpg', price: 690, oldPrice: null, rating: 4.7, reviews: 29, badge: 'Yeni', badgeType: 'new', addedAt: '2026-09-30', sales: 90 },
  { id: 'p29', name: 'Taş Desen PVC Duvar Paneli', brand: 'Örnek Marka', category: 'duvar', image: 'vinil-stone-grey.jpg', price: 420, oldPrice: 490, rating: 4.3, reviews: 36, badge: '%14 İndirim', badgeType: 'sale', addedAt: '2026-05-28', sales: 240 },

  // ---------- İNŞAAT MALZEMELERİ ----------
  { id: 'p30', name: 'Alçıpan Levha 12,5mm', brand: 'Örnek Marka', category: 'insaat', unit: 'adet', image: 'vinil-stone-grey.jpg', price: 185, oldPrice: null, rating: 4.5, reviews: 52, badge: null, badgeType: null, addedAt: '2026-02-20', sales: 700 },
  { id: 'p31', name: 'OSB Levha 11mm', brand: 'Örnek Marka', category: 'insaat', unit: 'adet', image: 'deck-kompozit.jpg', price: 410, oldPrice: null, rating: 4.4, reviews: 24, badge: null, badgeType: null, addedAt: '2026-03-14', sales: 330 },

  // ---------- DEKORASYON ÜRÜNLERİ ----------
  { id: 'p32', name: 'Dekoratif Çıta - Meşe 2,4m', brand: 'Örnek Marka', category: 'dekorasyon', unit: 'adet', image: 'spc-mese.jpg', price: 120, oldPrice: null, rating: 4.6, reviews: 19, badge: null, badgeType: null, addedAt: '2026-07-30', sales: 210 },
  { id: 'p33', name: 'Ahşap Lambri Panel', brand: 'Örnek Marka', category: 'dekorasyon', image: 'laminat-oak-naturel.jpg', price: 560, oldPrice: 640, rating: 4.7, reviews: 11, badge: '%12 İndirim', badgeType: 'sale', addedAt: '2026-10-08', sales: 40 },
];
 
export const PRODUCT_DETAILS: Record<string, Partial<ProductDetailExtra>> = {
  p1: {
    boxM2: 2.22,
    images: ['laminat-oak-naturel.jpg', 'spc-mese.jpg', 'lvt-baliksirti.jpg'],
    description:
      'Doğal meşe görünümüyle sıcak ve aydınlık mekânlar için ideal laminat parke. Çizilmeye dayanıklı yüzeyi ve tıklamalı (click) kilit sistemi sayesinde kolay ve hızlı uygulanır.',
    features: ['AC4 aşınma sınıfı', 'Tıklamalı kilit sistemi', 'Yerden ısıtmaya uygun'],
    specs: { Kalınlık: '8 mm', 'Aşınma Sınıfı': 'AC4 / 32', 'Paket İçeriği': '2,22 m²', 'Kilit Sistemi': 'Click', 'Yerden Isıtma': 'Uygun', Garanti: '[Garanti süresi]' },
  },
  p2: {
    boxM2: 2.0,
    description: 'Suya dayanıklı vinil yapısıyla mutfak ve banyo dahil tüm ıslak zeminlerde gönül rahatlığıyla kullanılabilir. Taş görünümlü modern bir zemin.',
    features: ['%100 su geçirmez', 'Sessiz adım yüzeyi', 'Yerden ısıtmaya uygun'],
    specs: { Kalınlık: '5 mm', 'Aşınma Tabakası': '0,55 mm', 'Paket İçeriği': '2,00 m²', 'Su Geçirmezlik': 'Var', Garanti: '[Garanti süresi]' },
  },
  p3: {
    boxM2: 2.23,
    description: 'Taş-plastik kompozit (SPC) çekirdeği sayesinde darbelere ve ısı değişimine karşı yüksek dayanım sağlar. Meşe desenli, mat yüzeyli.',
    features: ['Rijit SPC çekirdek', 'Su geçirmez', 'Entegre ses yalıtımı'],
    specs: { Kalınlık: '4 mm', 'Aşınma Tabakası': '0,3 mm', 'Paket İçeriği': '2,23 m²', 'Kilit Sistemi': 'Click', Garanti: '[Garanti süresi]' },
  },
  p4: {
    boxM2: 1.67,
    description: 'Klasik balıksırtı desenini LVT’nin pratikliğiyle buluşturan, şık ve dayanıklı bir zemin kaplaması.',
    features: ['Balıksırtı döşeme', 'Yapıştırma uygulama', 'Islak hacimlere uygun'],
    specs: { Kalınlık: '3 mm', 'Paket İçeriği': '1,67 m²', Uygulama: 'Yapıştırma', Garanti: '[Garanti süresi]' },
  },
  p5: {
    boxM2: 1.0,
    description: 'Ahşap görünümlü kompozit (WPC) deck; balkon, teras ve bahçelerde çürüme, böceklenme ve çatlama yapmadan uzun yıllar kullanılır.',
    features: ['UV dayanımlı', 'Kaymaz yüzey', 'Bakım gerektirmez'],
    specs: { Kalınlık: '20 mm', Malzeme: 'WPC kompozit', 'Paket İçeriği': '1,00 m²', Kullanım: 'Dış mekan', Garanti: '[Garanti süresi]' },
  },
};

export const DEFAULT_DETAILS: ProductDetailExtra = {
  boxM2: null,
  description: 'Ürün açıklaması yakında eklenecek. Bilgi almak için bizimle iletişime geçebilirsiniz.',
  features: ['Orijinal ve faturalı ürün', '14 gün içinde kolay iade'],
  specs: {},
};