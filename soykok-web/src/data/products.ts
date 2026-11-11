import type { Product, ProductDetailExtra } from '@/lib/types';

/**
 * Yedek katalog: API'ye ulaşılamazsa sayfalar bu veriyle çizilir (lib/catalog.ts).
 * Backend'deki örnek katalogla (Persistence/Seed/*.json) aynıdır; asıl veri her zaman API'dir.
 *
 * price / oldPrice: TL (sayı). oldPrice yoksa null.
 * badge: kartın sol üstündeki etiket (yoksa null); badgeType: 'sale' | 'new' | 'info' → etiket rengi
 * unit: fiyat birimi (adet, torba, paket, m² ...)
 */

export const CATEGORIES: Record<string, string> = {
  "ic-cephe-boyasi": "İç Cephe Boyası",
  "dis-cephe-boyasi": "Dış Cephe Boyası",
  "vernik-ahsap": "Vernik ve Ahşap Koruyucu",
  "boya-malzemeleri": "Fırça, Rulo ve Boya Malzemeleri",
  "el-aletleri": "El Aletleri",
  "baglanti-elemanlari": "Vida, Dübel ve Bağlantı",
  "elektrikli-aletler": "Elektrikli Aletler",
  "batarya-musluk": "Batarya ve Musluk",
  "boru-baglanti": "Boru ve Bağlantı Parçaları",
  "vana-sayac": "Vana ve Su Sayacı",
  "cimento-harc": "Çimento ve Harç",
  "alci-alcipan": "Alçı ve Alçıpan",
  "isi-yalitimi": "Isı Yalıtımı",
  "yapistirici": "Yapıştırıcı",
  "derz": "Derz Dolgu",
  "silikon-mastik": "Silikon ve Mastik",
  "su-yalitimi": "Su Yalıtımı",
};

export const CATEGORY_GROUPS: Record<string, string[]> = {
  "boya": ["ic-cephe-boyasi", "dis-cephe-boyasi", "vernik-ahsap", "boya-malzemeleri"],
  "hirdavat": ["el-aletleri", "baglanti-elemanlari", "elektrikli-aletler"],
  "tesisat": ["batarya-musluk", "boru-baglanti", "vana-sayac"],
  "insaat-malzemeleri": ["cimento-harc", "alci-alcipan", "isi-yalitimi"],
  "kimyasal": ["yapistirici", "derz", "silikon-mastik", "su-yalitimi"],
};

export const GROUP_LABELS: Record<string, string> = {
  "boya": "Boya ve Vernik",
  "hirdavat": "Hırdavat ve El Aletleri",
  "tesisat": "Tesisat ve Banyo",
  "insaat-malzemeleri": "İnşaat Malzemeleri",
  "kimyasal": "Yapı Kimyasalları",
};

export const PRODUCTS: Product[] = [
  { id: "ic-boya-silikonlu-7-5l", name: "Silikonlu İç Cephe Boyası Beyaz 7,5 L", brand: "Filli Boya", category: "ic-cephe-boyasi", unit: "adet", image: "ic-boya-silikonlu-7-5l.jpg", price: 1450, oldPrice: 1690, rating: 0, reviews: 0, badge: "İndirim", badgeType: "sale", addedAt: "2026-11-01", sales: 0, sortOrder: 1 },
  { id: "tavan-boyasi-10l", name: "Tavan Boyası Beyaz 10 L", brand: "Marshall", category: "ic-cephe-boyasi", unit: "adet", image: "tavan-boyasi-10l.jpg", price: 890, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-02", sales: 0, sortOrder: 2 },
  { id: "ic-astar-7-5l", name: "Su Bazlı İç Cephe Astarı 7,5 L", brand: "Dyo", category: "ic-cephe-boyasi", unit: "adet", image: "ic-astar-7-5l.jpg", price: 720, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-03", sales: 0, sortOrder: 3 },
  { id: "dis-boya-silikonlu-15l", name: "Silikonlu Dış Cephe Boyası 15 L", brand: "Filli Boya", category: "dis-cephe-boyasi", unit: "adet", image: "dis-boya-silikonlu-15l.jpg", price: 3250, oldPrice: 3600, rating: 0, reviews: 0, badge: "İndirim", badgeType: "sale", addedAt: "2026-11-04", sales: 0, sortOrder: 4 },
  { id: "dis-boya-elastomerik-15l", name: "Elastomerik Dış Cephe Boyası 15 L", brand: "Marshall", category: "dis-cephe-boyasi", unit: "adet", image: "dis-boya-elastomerik-15l.jpg", price: 3890, oldPrice: null, rating: 0, reviews: 0, badge: "Yeni", badgeType: "new", addedAt: "2026-11-05", sales: 0, sortOrder: 5 },
  { id: "ahsap-koruyucu-ceviz-2-5l", name: "Ahşap Koruyucu Ceviz 2,5 L", brand: "Pinotex", category: "vernik-ahsap", unit: "adet", image: "ahsap-koruyucu-ceviz-2-5l.jpg", price: 980, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-06", sales: 0, sortOrder: 6 },
  { id: "parlak-vernik-0-75l", name: "Parlak Ahşap Verniği 0,75 L", brand: "Dyo", category: "vernik-ahsap", unit: "adet", image: "parlak-vernik-0-75l.jpg", price: 340, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-07", sales: 0, sortOrder: 7 },
  { id: "boya-rulosu-25cm", name: "Boya Rulosu Saplı 25 cm", brand: "Soykök", category: "boya-malzemeleri", unit: "adet", image: "boya-rulosu-25cm.jpg", price: 145, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-08", sales: 0, sortOrder: 8 },
  { id: "boya-fircasi-seti-3", name: "Boya Fırçası Seti (3'lü)", brand: "Soykök", category: "boya-malzemeleri", unit: "paket", image: "boya-fircasi-seti-3.jpg", price: 120, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-09", sales: 0, sortOrder: 9 },
  { id: "maskeleme-bandi-48mm", name: "Maskeleme Bandı 48 mm x 40 m", brand: "Soykök", category: "boya-malzemeleri", unit: "adet", image: "maskeleme-bandi-48mm.jpg", price: 65, oldPrice: null, rating: 0, reviews: 0, badge: "Çok Satan", badgeType: "info", addedAt: "2026-11-10", sales: 0, sortOrder: 10 },
  { id: "tornavida-seti-6", name: "Tornavida Seti 6 Parça", brand: "Ceta Form", category: "el-aletleri", unit: "set", image: "tornavida-seti-6.jpg", price: 420, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-01", sales: 0, sortOrder: 11 },
  { id: "cekic-500g", name: "Çekiç 500 g Fiberglas Saplı", brand: "Ceta Form", category: "el-aletleri", unit: "adet", image: "cekic-500g.jpg", price: 310, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-02", sales: 0, sortOrder: 12 },
  { id: "serit-metre-5m", name: "Şerit Metre 5 m", brand: "Ceta Form", category: "el-aletleri", unit: "adet", image: "serit-metre-5m.jpg", price: 160, oldPrice: null, rating: 0, reviews: 0, badge: "Çok Satan", badgeType: "info", addedAt: "2026-11-03", sales: 0, sortOrder: 13 },
  { id: "sunta-vidasi-4x40-200", name: "Sunta Vidası 4x40 mm (200 Adet)", brand: "Soykök", category: "baglanti-elemanlari", unit: "paket", image: "sunta-vidasi-4x40-200.jpg", price: 135, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-04", sales: 0, sortOrder: 14 },
  { id: "plastik-dubel-8mm-100", name: "Plastik Dübel 8 mm (100 Adet)", brand: "Fischer", category: "baglanti-elemanlari", unit: "paket", image: "plastik-dubel-8mm-100.jpg", price: 95, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-05", sales: 0, sortOrder: 15 },
  { id: "darbeli-matkap-750w", name: "Darbeli Matkap 750 W", brand: "Bosch", category: "elektrikli-aletler", unit: "adet", image: "darbeli-matkap-750w.jpg", price: 2950, oldPrice: 3290, rating: 0, reviews: 0, badge: "İndirim", badgeType: "sale", addedAt: "2026-11-06", sales: 0, sortOrder: 16 },
  { id: "akulu-vidalama-18v", name: "Akülü Vidalama 18 V", brand: "Bosch", category: "elektrikli-aletler", unit: "adet", image: "akulu-vidalama-18v.jpg", price: 4650, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-07", sales: 0, sortOrder: 17 },
  { id: "lavabo-bataryasi-krom", name: "Lavabo Bataryası Krom", brand: "Artema", category: "batarya-musluk", unit: "adet", image: "lavabo-bataryasi-krom.jpg", price: 1890, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-08", sales: 0, sortOrder: 18 },
  { id: "eviye-bataryasi-spiralli", name: "Eviye Bataryası Spiralli", brand: "Artema", category: "batarya-musluk", unit: "adet", image: "eviye-bataryasi-spiralli.jpg", price: 2150, oldPrice: null, rating: 0, reviews: 0, badge: "Yeni", badgeType: "new", addedAt: "2026-11-09", sales: 0, sortOrder: 19 },
  { id: "ppr-boru-20mm-4m", name: "PPR Temiz Su Borusu 20 mm (4 m)", brand: "Fırat", category: "boru-baglanti", unit: "adet", image: "ppr-boru-20mm-4m.jpg", price: 85, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-10", sales: 0, sortOrder: 20 },
  { id: "kuresel-vana-1-2", name: "Küresel Vana 1/2\"", brand: "E.C.A.", category: "vana-sayac", unit: "adet", image: "kuresel-vana-1-2.jpg", price: 210, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-01", sales: 0, sortOrder: 21 },
  { id: "su-sayaci-1-2", name: "Su Sayacı Soğuk Su 1/2\"", brand: "Baylan", category: "vana-sayac", unit: "adet", image: "su-sayaci-1-2.jpg", price: 1150, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-02", sales: 0, sortOrder: 22 },
  { id: "cimento-50kg", name: "Çimento 50 kg", brand: "Akçansa", category: "cimento-harc", unit: "torba", image: "cimento-50kg.jpg", price: 290, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-03", sales: 0, sortOrder: 23 },
  { id: "hazir-siva-25kg", name: "Hazır Sıva 25 kg", brand: "Knauf", category: "cimento-harc", unit: "torba", image: "hazir-siva-25kg.jpg", price: 260, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-04", sales: 0, sortOrder: 24 },
  { id: "saten-alci-25kg", name: "Saten Alçı 25 kg", brand: "Knauf", category: "alci-alcipan", unit: "torba", image: "saten-alci-25kg.jpg", price: 330, oldPrice: null, rating: 0, reviews: 0, badge: "Çok Satan", badgeType: "info", addedAt: "2026-11-05", sales: 0, sortOrder: 25 },
  { id: "alcipan-12-5mm", name: "Alçıpan Levha 12,5 mm (120x250 cm)", brand: "Knauf", category: "alci-alcipan", unit: "adet", image: "alcipan-12-5mm.jpg", price: 340, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-06", sales: 0, sortOrder: 26 },
  { id: "eps-levha-3cm", name: "EPS Isı Yalıtım Levhası 3 cm", brand: "İzocam", category: "isi-yalitimi", unit: "m²", image: "eps-levha-3cm.jpg", price: 95, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-07", sales: 0, sortOrder: 27 },
  { id: "seramik-yapistiricisi-25kg", name: "Seramik Yapıştırıcısı Gri 25 kg", brand: "Kalekim", category: "yapistirici", unit: "torba", image: "seramik-yapistiricisi-25kg.jpg", price: 210, oldPrice: null, rating: 0, reviews: 0, badge: "Çok Satan", badgeType: "info", addedAt: "2026-11-08", sales: 0, sortOrder: 28 },
  { id: "derz-dolgu-beyaz-5kg", name: "Derz Dolgu Beyaz 5 kg", brand: "Kalekim", category: "derz", unit: "paket", image: "derz-dolgu-beyaz-5kg.jpg", price: 180, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-09", sales: 0, sortOrder: 29 },
  { id: "silikon-seffaf-280ml", name: "Silikon Şeffaf 280 ml", brand: "Akfix", category: "silikon-mastik", unit: "adet", image: "silikon-seffaf-280ml.jpg", price: 95, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-10", sales: 0, sortOrder: 30 },
  { id: "poliuretan-kopuk-750ml", name: "Poliüretan Köpük 750 ml", brand: "Akfix", category: "silikon-mastik", unit: "adet", image: "poliuretan-kopuk-750ml.jpg", price: 160, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-01", sales: 0, sortOrder: 31 },
  { id: "su-yalitim-harci-20kg", name: "Çimento Esaslı Su Yalıtım Harcı 20 kg", brand: "Kalekim", category: "su-yalitimi", unit: "paket", image: "su-yalitim-harci-20kg.jpg", price: 690, oldPrice: null, rating: 0, reviews: 0, badge: null, badgeType: null, addedAt: "2026-11-02", sales: 0, sortOrder: 32 },
];

export const PRODUCT_DETAILS: Record<string, Partial<ProductDetailExtra>> = {
  "ic-boya-silikonlu-7-5l": { description: "Silikon katkılı, silinebilir yüzey sağlayan mat iç cephe boyası. Salon, yatak odası ve koridor gibi tüm iç mekânlar için uygundur.", features: ["Silinebilir yüzey", "Düşük koku", "Yüksek örtücülük"], specs: {"Hacim": "7,5 L", "Görünüm": "Mat", "Renk": "Beyaz (renklendirilebilir)", "Kuruma": "2 saat (dokunma)", "Sarfiyat": "≈ 10–12 m²/L (tek kat)"} },
  "tavan-boyasi-10l": { description: "Tavanlarda leke ve iz bırakmayan, örtücülüğü yüksek mat beyaz boya.", features: ["Sıçramayı azaltan yapı", "Kolay uygulama"], specs: {"Hacim": "10 L", "Görünüm": "Mat", "Renk": "Beyaz"} },
  "ic-astar-7-5l": { description: "Boya öncesi yüzeyi hazırlayan, boya sarfiyatını azaltan su bazlı astar.", features: ["Boya tutunmasını artırır", "Su bazlı"], specs: {"Hacim": "7,5 L", "Kullanım": "Alçı, sıva, beton yüzeyler"} },
  "dis-boya-silikonlu-15l": { description: "Yağmur ve neme karşı su itici, nefes alan silikonlu dış cephe boyası.", features: ["Su itici", "UV dayanımı", "Nefes alan yapı"], specs: {"Hacim": "15 L", "Görünüm": "Mat", "Kullanım": "Dış cephe, sıva ve beton"} },
  "dis-boya-elastomerik-15l": { description: "Esnek yapısıyla kılcal çatlakları kapatan, uzun ömürlü dış cephe boyası.", features: ["Kılcal çatlak köprüleme", "Esnek film"], specs: {"Hacim": "15 L", "Görünüm": "Mat"} },
  "ahsap-koruyucu-ceviz-2-5l": { description: "Ahşap yüzeyleri güneş, yağmur ve böceklere karşı koruyan, ceviz renkli dekoratif koruyucu.", features: ["UV koruma", "Su itici", "Dekoratif renk"], specs: {"Hacim": "2,5 L", "Renk": "Ceviz", "Kullanım": "İç ve dış ahşap"} },
  "parlak-vernik-0-75l": { description: "Ahşaba parlak ve dayanıklı bir yüzey kazandıran şeffaf vernik.", features: ["Parlak görünüm", "Şeffaf"], specs: {"Hacim": "0,75 L", "Görünüm": "Parlak"} },
  "boya-rulosu-25cm": { description: "İç ve dış cephe boyaları için tüy bırakmayan, saplı boya rulosu.", features: ["Tüy bırakmaz", "Ergonomik sap"], specs: {"Genişlik": "25 cm"} },
  "boya-fircasi-seti-3": { description: "Kenar, köşe ve detay boyama için üç farklı ölçüde fırça.", features: ["3 farklı ölçü", "Ahşap sap"], specs: {"Ölçüler": "1\", 2\", 3\""} },
  "maskeleme-bandi-48mm": { description: "Boya sırasında kenarları korumak için iz bırakmadan sökülen kâğıt bant.", features: ["İz bırakmaz", "Kolay kesilir"], specs: {"Ölçü": "48 mm x 40 m"} },
  "tornavida-seti-6": { description: "Düz ve yıldız uçlu, ergonomik saplı 6 parça tornavida seti.", features: ["Manyetik uçlar", "Kaymaz sap"], specs: {"İçerik": "3 düz + 3 yıldız"} },
  "cekic-500g": { description: "Titreşimi azaltan fiberglas saplı, çatallı marangoz çekici.", features: ["Fiberglas sap", "Çivi sökme çatalı"], specs: {"Ağırlık": "500 g"} },
  "serit-metre-5m": { description: "Kilit mekanizmalı, darbeye dayanıklı kasalı 5 metrelik şerit metre.", features: ["Kilit butonu", "Kemer klipsi"], specs: {"Uzunluk": "5 m", "Genişlik": "19 mm"} },
  "sunta-vidasi-4x40-200": { description: "Mobilya ve ahşap işleri için sarı galvaniz kaplı yıldız başlı sunta vidası.", features: ["Galvaniz kaplama", "Yıldız baş"], specs: {"Ölçü": "4 x 40 mm", "Adet": "200"} },
  "plastik-dubel-8mm-100": { description: "Tuğla ve beton duvarlar için genel amaçlı plastik dübel.", features: ["Dönmeyi önleyen kanatlar"], specs: {"Çap": "8 mm", "Adet": "100"} },
  "darbeli-matkap-750w": { description: "Beton, ahşap ve metalde delme için darbeli, devir ayarlı matkap.", features: ["Darbe modu", "Devir ayarı", "Sağ/sol dönüş"], specs: {"Güç": "750 W", "Mandren": "13 mm"} },
  "akulu-vidalama-18v": { description: "Kablosuz kullanım için 18 V akülü vidalama ve delme makinesi.", features: ["2 hız kademesi", "LED çalışma lambası"], specs: {"Voltaj": "18 V", "Akü": "2,0 Ah"} },
  "lavabo-bataryasi-krom": { description: "Tek kumandalı, krom kaplama lavabo bataryası.", features: ["Seramik kartuş", "Su tasarruflu perlatör"], specs: {"Kaplama": "Krom", "Montaj": "Tezgâh üstü"} },
  "eviye-bataryasi-spiralli": { description: "Esnek spiral gövdeli, iki modlu duş başlıklı mutfak eviye bataryası.", features: ["Spiral gövde", "2 su modu"], specs: {"Kaplama": "Krom"} },
  "ppr-boru-20mm-4m": { description: "Sıcak ve soğuk su tesisatı için PPR boru.", features: ["Paslanmaz", "Kaynakla birleştirme"], specs: {"Çap": "20 mm", "Boy": "4 m"} },
  "kuresel-vana-1-2": { description: "Pirinç gövdeli, kelebek kollu küresel vana.", features: ["Pirinç gövde", "Tam geçişli"], specs: {"Bağlantı": "1/2\""} },
  "su-sayaci-1-2": { description: "Konut tipi, kuru tip soğuk su sayacı.", features: ["Kuru tip mekanizma"], specs: {"Bağlantı": "1/2\"", "Tip": "Soğuk su"} },
  "cimento-50kg": { description: "Genel inşaat işleri, sıva ve beton için çimento.", features: ["Genel amaçlı"], specs: {"Ağırlık": "50 kg"} },
  "hazir-siva-25kg": { description: "Su ile karıştırılarak kullanılan, iç mekân hazır sıvası.", features: ["Kolay karışım"], specs: {"Ağırlık": "25 kg"} },
  "saten-alci-25kg": { description: "Boya öncesi pürüzsüz yüzey için ince saten alçı.", features: ["Pürüzsüz yüzey", "Kolay zımparalanır"], specs: {"Ağırlık": "25 kg"} },
  "alcipan-12-5mm": { description: "Bölme duvar ve asma tavan için standart alçıpan levha.", features: ["Standart levha"], specs: {"Kalınlık": "12,5 mm", "Ölçü": "120 x 250 cm"} },
  "eps-levha-3cm": { description: "Dış cephe mantolama için genleştirilmiş polistiren ısı yalıtım levhası.", features: ["Hafif", "Kolay kesilir"], specs: {"Kalınlık": "3 cm", "Levha": "50 x 100 cm"} },
  "seramik-yapistiricisi-25kg": { description: "İç ve dış mekânda seramik ve fayans yapıştırmak için çimento esaslı yapıştırıcı.", features: ["İç ve dış mekân", "Kaymaz"], specs: {"Ağırlık": "25 kg", "Renk": "Gri"} },
  "derz-dolgu-beyaz-5kg": { description: "Seramik derzleri için su itici, beyaz derz dolgu.", features: ["Su itici", "Küf önleyici"], specs: {"Ağırlık": "5 kg", "Renk": "Beyaz"} },
  "silikon-seffaf-280ml": { description: "Banyo, mutfak ve cam kenarları için şeffaf silikon.", features: ["Küfe dayanıklı", "Esnek"], specs: {"Hacim": "280 ml"} },
  "poliuretan-kopuk-750ml": { description: "Kapı, pencere kasası ve boşluk doldurma için genleşen köpük.", features: ["Yüksek dolgu"], specs: {"Hacim": "750 ml"} },
  "su-yalitim-harci-20kg": { description: "Banyo, balkon ve teraslarda su yalıtımı için iki bileşenli esnek harç.", features: ["Esnek", "İki bileşenli"], specs: {"Ağırlık": "20 kg set"} },
};

export const DEFAULT_DETAILS: ProductDetailExtra = {
  boxM2: null,
  description: 'Ürün açıklaması yakında eklenecek. Bilgi almak için bizimle iletişime geçebilirsiniz.',
  features: ['Orijinal ve faturalı ürün', '14 gün içinde kolay iade'],
  specs: {},
};
