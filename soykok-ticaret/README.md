# Soykök Ticaret – Frontend

Vite + Tailwind CSS v4 ile hazırlanmış statik HTML arayüzü.

## Kurulum

```bash
npm install
npm run dev       # geliştirme sunucusu
npm run build     # dist/ klasörüne üretim çıktısı
npm run preview   # build çıktısını önizle
```

## Klasör yapısı

```
├── index.html                 Ana sayfa (yalnızca include'lardan oluşur)
├── plugins/html-include.js    <include> etiketlerini işleyen Vite eklentisi
├── public/images/             Görseller (logo, hero, categories, products, brands, banners)
└── src/
    ├── css/main.css           Tailwind + tema renkleri
    ├── js/main.js             Giriş dosyası, ikonlar
    ├── js/modules/            menu, hero-slider, shop, newsletter
    └── partials/
        ├── head.html          <head> içeriği (title, description değişkenli)
        ├── header.html        Üst bar + header + mega menü
        ├── mobile-menu.html   Mobil çekmece menü
        ├── footer.html
        ├── components/        Tekrar kullanılan kartlar
        └── home/              Ana sayfa bölümleri
```

## Partial kullanımı

```html
<include src="footer.html"></include>
<include src="header.html" megaPinned="data-pinned"></include>
```

Partial içindeki `{{degisken}}` yer tutucuları, include etiketindeki aynı adlı
özelliğin değeriyle doldurulur. Verilmeyen değişkenler boş kalır.

### Ürün kartı değişkenleri (`components/product-card.html`)

| Değişken | Açıklama |
|---|---|
| `id` | Sepet/favori için benzersiz kimlik |
| `href`, `image`, `name`, `brand` | Link, görsel dosya adı, ürün adı, marka |
| `badge`, `badgeClass` | Etiket metni ve rengi (`bg-sale`, `bg-green-600`, `bg-brand-900`). Boşsa etiket gizlenir |
| `rating`, `ratingWidth`, `reviews` | Puan, yıldız doluluğu (puan ÷ 5 × 100, örn. `96%`), yorum sayısı |
| `oldPrice` | Eski fiyat. Boşsa gösterilmez |
| `price`, `priceClass` | Fiyat; indirimliyse `priceClass="text-sale"` |

## Yeni sayfa ekleme

Kök dizine yeni bir `.html` dosyası koymak yeterli (örn. `urunler.html`).
`vite.config.js` kökteki tüm HTML dosyalarını otomatik olarak build'e ekler.
Ana sayfa dışındaki sayfalarda header'ı `megaPinned` olmadan çağırın.

## Sepet

| Dosya | Görevi |
|---|---|
| `src/js/store/cart.js` | Sepet deposu: ürün dizisi, `add / setQty / increment / remove / clear`, toplam ve kargo hesabı. Dizi `localStorage`'a da yazılır |
| `src/js/modules/cart-ui.js` | Header rozeti, sağdan açılan mini sepet, ortak satır parçaları |
| `src/js/modules/cart-page.js` | `sepet.html` sayfasının listesi ve sipariş özeti |
| `src/partials/cart-drawer.html` | Mini sepet HTML'i (sepet sayfası hariç her sayfaya eklenir) |

Ücretsiz kargo sınırı ve kargo ücreti `cart.js` başındaki `FREE_SHIPPING_LIMIT` ve
`SHIPPING_FEE` sabitlerinde. "Sepete Ekle" butonu ürün bilgisini `data-*`
özelliklerinden okur; ürün kartında fiyatın sayısal hali `priceValue` değişkeniyle verilir.

## Ödeme akışı

`sepet.html` → `odeme.html` → `siparis-tamamlandi.html`

| Dosya | Görevi |
|---|---|
| `src/js/modules/checkout.js` | Form doğrulama, il listesi, telefon biçimlendirme, teslimat yöntemine göre kargo, sipariş gönderimi |
| `src/js/store/order.js` | `placeOrder()` – şimdilik demo; backend'de `POST /api/orders` olacak |
| `src/js/modules/order-success.js` | Onay sayfası (sipariş no, havale bilgisi, özet) |
| `src/partials/checkout-header.html` | Ödeme sayfalarındaki sade header |

Kart bilgisi bu sitede **toplanmaz**: kartla ödemede müşteri, ödeme kuruluşunun
3D Secure sayfasına yönlendirilecek. Onay sayfası için tarayıcıda yalnızca ad,
e-posta, sipariş no, ürünler ve toplamlar `sessionStorage`'da tutulur.
`[Banka adı]`, `[IBAN]` ve `[Telefon]` yer tutucularını doldurmayı unutmayın.
