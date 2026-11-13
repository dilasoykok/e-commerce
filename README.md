# Soykök Ticaret — E-Ticaret Sitesi

Safranbolu / Karabük'teki Soykök Ticaret (Harun Soykök) yapı malzemeleri mağazasının online satış sitesi:
boya ve vernik, hırdavat, tesisat, inşaat malzemeleri, yapı kimyasalları.

Arayüz (`soykok-web/`, Next.js) ve altyapı servisleri tek bir `docker compose` ile ayağa kalkar.
Tüm trafik **nginx** reverse proxy üzerinden geçer.

| Servis      | İmaj                              | Erişim                                   |
|-------------|-----------------------------------|------------------------------------------|
| nginx       | `nginx:1.27-alpine`               | http://localhost (tek giriş noktası)     |
| frontend    | `soykok-web` (Next.js standalone) | http://localhost/                        |
| migrator    | `backend` (EF Core migrations)    | API'den önce çalışır ve kapanır          |
| api         | `backend` (ASP.NET Core, .NET 10) | http://localhost/api/                    |
| Keycloak    | `quay.io/keycloak/keycloak:26.0`  | http://localhost/auth/admin              |
| PostgreSQL  | `postgres:17-alpine`              | `127.0.0.1:5432` (`POSTGRES_PORT`)       |
| Redis       | `redis:7-alpine`                  | `127.0.0.1:6379` (`REDIS_PORT`)          |
| RabbitMQ    | `rabbitmq:4-management-alpine`    | AMQP `127.0.0.1:5672` (`RABBITMQ_PORT`), panel http://localhost/rabbitmq/ |

PostgreSQL, Redis ve RabbitMQ (AMQP) yalnızca `127.0.0.1`'e açılır; dışarıdan erişilemez.
Bilgisayardaki portlar `.env`'den değiştirilebilir (bkz. [Sorun giderme](#sorun-giderme)); konteynerler
birbirine her zaman iç ağdan (`postgres:5432`, `redis:6379` ...) bağlanır.

## Proje durumu

### Yapılanlar

**Mağaza (müşteri tarafı)**
- Next.js 16 arayüz: ana sayfa, ürün listesi (filtre, sıralama, sayfalama), ürün detayı (galeri, miktar hesaplayıcı), sepet, ödeme, sipariş onayı
- Firma bilgileri (Harun Soykök – Soykök Ticaret, Safranbolu adresi, telefon, çalışma saatleri, harita ve yol tarifi) tek yerden: `src/lib/store-info.ts`, `src/lib/company.ts`
- Yapı malzemeleri örnek kataloğu: 5 üst kategori, 17 alt kategori, 32 ürün ve görselleri
- Kategori menüsü (masaüstü, mobil, footer) ve arama kutusundaki kategoriler veritabanından gelir
- Canlı arama önerileri: 2 harften itibaren kategori, marka ve ürün; Türkçe karakterden bağımsız (alci → Alçı ve Alçıpan)
- Üyelik (Keycloak): giriş, kayıt, siparişlerim, **profilim** (ad, soyad, cep telefonu, kampanya izni; ödeme formunu otomatik doldurur), **adreslerim** (en fazla 10 adres; ödemede tek tıkla seçilir, yeni adres siparişte deftere kaydedilebilir); misafir sipariş takibi (numara + e-posta)
- Hesabım sekmeleri: Siparişlerim · Profilim · Adreslerim · Favorilerim · Çıkış (`/siparislerim`, `/hesabim/profil`, `/hesabim/adresler`)
- Giriş / üye ol ekranları sitenin tasarımında (Keycloak teması, bkz. [Giriş teması](#giriş-teması))
- Favoriler (tarayıcıda saklanır)
- Ürün yorumları: üyeler puan + yorum yazar, admin onayından sonra yayınlanır; ürünü satın almış üyede "Doğrulanmış alıcı" rozeti
- Ödeme: **kredi kartı (iyzico, 3D Secure)** ve **havale/EFT**; ürün sayfasında taksit tablosu ve "Peşin fiyatına N taksit" bilgisi
- Teslimat: kargo ya da **Safranbolu mağazasından ücretsiz teslim** (adres, saatler ve yol tarifi sipariş sayfasında ve e-postada)
- Stok: tükenen ürün "Tükendi" görünür, sepete eklenemez; az kalan stok uyarısı
- Kargo takibi: kargo firması + takip numarası ve takip bağlantısı
- Popüler Markalar: logolu, yumuşak kayan bant (kenarlarda şeffaf geçiş, fareyle durur, Durdur/Oynat düğmesi); markalar ve logolar admin panelinden
- İletişim formu, Hakkımızda, Mağazamız sayfaları
- Yasal ve yardım sayfaları: KVKK, ön bilgilendirme, mesafeli satış, iade, kargo, SSS (şablon metinler)
- SEO: sayfa başlıkları/açıklamaları, ürün yapısal verisi (JSON-LD), `sitemap.xml`, `robots.txt`
- Erişilebilirlik: WCAG 2.2 AA, akışkan yazı boyutu, 320px'e kadar yatay kaydırmasız (bkz. [Erişilebilirlik](#erişilebilirlik-ve-duyarlı-tasarım-wcag-22-aa))

**Yönetim paneli (`/admin`, admin rolü gerekir)**
- Siparişler: liste, arama, durum değiştirme (havale onayı, hazırlanıyor, kargoya verildi + takip no, teslim, iptal → stok iadesi)
- Ürünler: ekle / düzenle / sil, fiyat ve indirim, **görsel yükleme** (ana görsel + galeri), **stok adedi**
- Kategoriler: üst ve alt kategori ekle / düzenle / sil
- Markalar: marka ekle / düzenle / sil, **logo yükle / değiştir**, sıra, ana sayfa bandında göster / gizle
- Yorumlar: onay bekleyen yorumları onayla / reddet (onaylanınca ürünün puanı ve yorum sayısı güncellenir)
- Mesajlar: iletişim formundan gelen mesajlar (okunmamış rozeti, okundu işaretleme, e-postayla yanıtla, sil)

**Altyapı**
- .NET 10 API (Clean Architecture), PostgreSQL, Redis önbellek, RabbitMQ olayları, nginx, Docker Compose
- Sunucu tarafında fiyat/kargo hesabı, stok için transaction içinde koşullu düşüm (fazla satış olmaz)
- Sipariş e-postaları (SMTP): sipariş alındı, ödeme onayı, kargoda, teslim, iptal + admin'e yeni sipariş / yeni mesaj bildirimi
- Yarım kalan kart ödemeleri 5 dakikada bir iyzico'ya sorulur: ödenmişse onaylanır, ödenmemişse iptal edilip stok iade edilir
- İletişim formu veritabanına kaydedilir; IP başına 10 dakikada 5 mesaj sınırı ve spam tuzağı

### Son değişiklikler

**13 Kasım 2026**
- Giriş / üye ol ekranı sitenin tasarımına uygun yeniden yapıldı (`keycloak/themes/soykok`)
- Taksit: ürün sayfasında "Peşin fiyatına N taksit" satırı ve **Taksit Seçenekleri** sekmesi, ödemede taksit özeti (iyzico taksit sorgusu)
- Mağazadan teslim: sipariş sayfasında, Siparişlerim'de ve "Siparişiniz hazır" e-postasında adres, saatler ve yol tarifi
- Metin temizliği: parke döneminden kalan "numune", "montaj", "metrekare" ifadeleri kaldırıldı; birimi girilmemiş ürünlerde varsayılan birim "adet"
- Üye hesabı: **Profilim** (ad, soyad, telefon, kampanya izni) ve **Adreslerim** (adres defteri); ödeme formu bu bilgilerle dolar, kayıtlı adres tek tıkla seçilir
- Markalar: 8 markanın resmi logosu, kayan marka bandı geri geldi; **Admin → Markalar** ile logo yükleme / değiştirme, marka ekleme / silme, sıralama
- Migration'lar: `AddBrands` (catalog.brands + ilk 8 marka)

**11–12 Kasım 2026**
- Ürün yorumları ve admin onayı, firma bilgileri, yapı malzemeleri kataloğu, erişilebilirlik (WCAG 2.2 AA), iletişim formu, kartla ödemede yarım kalan ödemelerin takibi

### Eksikler / sıradaki işler

**Firmadan beklenen bilgiler**
- E-posta adresi, vergi dairesi ve vergi no, IBAN (`soykok-web/src/lib/company.ts`, `store-info.ts`, `orders.ts`)
- İade/değişim politikası, kata çıkarma hizmeti, anlaşmalı kargo firması, kuruluş yılı ve Hakkımızda hikâyesi
- Gerçek ürün fiyatları, markalar ve fotoğraflar (örnek katalog yerine)
- Yasal metinler bir hukukçuya okutulmalı

**Ayarlar**
- **SMTP** — `.env`'deki `SMTP_*` satırları boş; doldurulana kadar e-posta gönderilmez (bkz. [Sipariş e-postaları](#sipariş-e-postaları)).

**Geliştirme sırası**
1. ~~Firma bilgileri ve yapı malzemeleri kataloğu~~ ✓
2. ~~Erişilebilirlik ve duyarlı tasarım (WCAG 2.2 AA)~~ ✓
3. ~~Ürün yorumları~~ ✓
4. Üye hesabı: ~~profil~~ ✓, ~~kayıtlı adresler~~ ✓, favorilerin hesaba kaydı
5. Admin: toplu fiyat güncelleme, Excel/CSV içe-dışa aktarma
6. Otomatik testler ve GitHub Actions
7. Yayına alma: alan adı, HTTPS, canlı iyzico anahtarları, `.env`'deki `change_me` şifreleri, Keycloak geliştirme kullanıcısının silinmesi, veritabanı ve `uploads` volume yedeği

İleride: e-Arşiv fatura.

## Kurulum

Gerekenler: Docker Desktop. Bilgisayarda .NET SDK ya da Node.js kurulu olması gerekmez; her şey
konteynerlerde derlenir.

```bash
cp .env.example .env          # şifreleri değiştirin
docker compose up -d --build
docker compose ps             # migrator "Exited (0)", diğerleri running/healthy olmalı
docker compose logs migrator  # "Veritabanı hazır"
curl http://localhost/api/health   # {"status":"ok",...}
```

Açılış sırası: `postgres` → **`migrator`** (migration + örnek veri, sonra kapanır) → `api` → `nginx`.
`api` yalnızca migrator başarıyla biterse başlar. İlk açılışta Keycloak'ın hazır olması ~30-60 sn
sürebilir: `docker compose logs -f keycloak`

## Keycloak

- Yönetim konsolu: http://localhost/auth/admin — kullanıcı/şifre `.env` içindeki `KEYCLOAK_ADMIN*`
- `keycloak/import/soykok-realm.json` ilk açılışta otomatik içe aktarılır:
  - Realm: **soykok** (kayıt açık, e-posta ile giriş, Türkçe arayüz)
  - Client: **soykok-bff** — site girişi; backend üzerinden Authorization Code + PKCE, gizli anahtar `.env` → `KEYCLOAK_BFF_SECRET`
  - Roller: `customer` (varsayılan), `admin`
  - Client: **soykok-dev** — yalnızca yerel API testi için şifreyle token alma (password grant)
  - Geliştirme kullanıcısı: `admin@soykok.local` / `Admin123!` (rol: admin) — **canlıya çıkmadan silin**
  - Token'lara `soykok-api` audience'ı eklenir (API bunu doğrular)
- Realm dosyası yalnızca realm **yoksa** içe aktarılır. Değişiklikten sonra yeniden yüklemek için
  `docker compose down -v && docker compose up -d --build` (tüm yerel veriler silinir).
- Issuer: `http://localhost/auth/realms/soykok`
- "Şifremi unuttum" ve e-posta doğrulama için Keycloak'ta SMTP ayarı gerekir
  (Yönetim konsolu → soykok realm → Realm settings → Email).
- `PUBLIC_URL` değişirse (ör. canlı alan adı) realm dosyasındaki `soykok-bff` yönlendirme adreslerini de güncelleyin.

### Giriş teması

E-posta/şifre ekranları (giriş, üye ol, şifremi unuttum ...) Keycloak'ta, **`keycloak/themes/soykok/login`**
temasıyla açılır: ortada logo ve form; sitenin renkleri ve Inter yazı tipi.

- `template.ftl` — tüm giriş sayfalarının ortak iskeleti (formların kendisi Keycloak'ın klasik temasından gelir)
- `resources/css/soykok.css` — görünüm; `messages/messages_tr.properties` — Türkçe metinler

Yeni kurulumda realm dosyası temayı kendisi seçer (`"loginTheme": "soykok"`). **Var olan** kurulumda bir kez:

```bash
docker compose up -d keycloak
docker compose exec keycloak sh -c '/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080/auth --realm master --user "$KC_BOOTSTRAP_ADMIN_USERNAME" --password "$KC_BOOTSTRAP_ADMIN_PASSWORD" && /opt/keycloak/bin/kcadm.sh update realms/soykok -s loginTheme=soykok'
```

(ya da yönetim konsolu → soykok realm → Realm settings → Themes → Login theme: `soykok`). Geliştirmede
tema önbelleği kapalı; CSS/metin değişince sayfayı yenilemek yeter.

### Site girişi nasıl çalışır

1. Sitedeki **Giriş Yap / Kayıt Ol** butonları (`/hesap`, üst menü) `/api/auth/login` ya da `/api/auth/register`'a gider.
2. Backend tarayıcıyı Keycloak'ın giriş/kayıt sayfasına yönlendirir; şifre siteye hiç gelmez.
3. Keycloak `/api/auth/callback`'e döner; backend **HttpOnly** `soykok.session` çerezi verir.
   Oturum bilgisi (kullanıcı, roller, token'lar) **Redis**'te tutulur, çerez yalnızca anahtarı taşır.
4. Sayfalar giriş durumunu `GET /api/auth/user` ile öğrenir (`soykok-web/src/hooks/useUser.ts`).
5. Çıkış: `/api/auth/logout` hem sitedeki hem Keycloak'taki oturumu kapatır.

API'yi araçlarla (curl, Postman) test ederken `Authorization: Bearer <token>` da kullanılabilir.

## Backend API (`backend/`)

ASP.NET Core (.NET 10), **Clean Architecture** ile dört katman. PostgreSQL (EF Core), Redis
(katalog önbelleği + oturumlar), RabbitMQ (olaylar) ve Keycloak bağlı. Veritabanı şeması EF Core
migration'larıyla yönetilir; **şema, ER diyagramı ve tasarım kararları: [`backend/docs/database.md`](backend/docs/database.md)**.

### Katmanlar

```
backend/
├── Soykok.slnx                  # çözüm dosyası (Rider / Visual Studio / dotnet CLI)
├── Directory.Build.props        # ortak ayarlar (net10.0, nullable ...)
└── src/
    ├── Soykok.Domain/           # varlıklar ve iş kuralları — hiçbir şeye bağımlı değil
    │   ├── Catalog/             # Product, Category, CategoryGroup, Brand
    │   ├── Customers/           # Customer, CustomerAddress, FavoriteProduct
    │   ├── Ordering/            # Order, OrderItem, OrderStatusChange (durum geçişleri)
    │   ├── Inventory/           # StockItem
    │   ├── Reviews/             # ProductReview
    │   ├── Support/             # ContactMessage (iletişim formu)
    │   └── Common/              # PostalAddress, InvoiceInfo, DomainException
    ├── Soykok.Application/      # kullanım senaryoları — yalnızca Domain'e bağlı
    │   ├── Common/              # Result/Error, IQueryHandler/ICommandHandler, arayüzler (repository, cache, olay)
    │   ├── Catalog/             # Queries (GetProducts ...), Commands (CreateProduct ...), Admin (kategoriler, markalar), Contracts (DTO)
    │   ├── Customers/           # üye profili, adres defteri
    │   ├── Ordering/            # sipariş verme, takip, admin durum değişikliği
    │   ├── Payments/            # kart ödemesi sonucu, yarım kalan ödemeler
    │   ├── Reviews/             # ürün yorumları (site + admin onayı)
    │   └── Support/             # iletişim mesajları
    ├── Soykok.Infrastructure/   # arayüzlerin uygulamaları — Application'a bağlı
    │   ├── Persistence/         # EF Core DbContext, konfigürasyonlar, migration'lar, repository'ler, örnek veri
    │   ├── Caching/             # Redis katalog önbelleği
    │   ├── Messaging/           # RabbitMQ olay yayıncısı
    │   ├── Payments/            # iyzico Checkout Form, PendingPaymentWorker
    │   ├── Notifications/       # SMTP, e-posta şablonları, OrderEmailWorker
    │   ├── Identity/            # Keycloak (OIDC + çerez + JWT), Redis oturum deposu
    │   └── Health/              # PostgreSQL / Redis / RabbitMQ sağlık kontrolleri
    ├── Soykok.Api/              # HTTP uç noktaları ve başlangıç (Program.cs)
    └── Soykok.Migrator/         # migration + örnek veri; Docker'da API'den önce çalışır
```

Bağımlılık yönü dışarıdan içe: **Api → Infrastructure → Application → Domain**.
Bir uç nokta yalnızca isteği ilgili handler'a iletir; iş mantığı Application'da, kurallar Domain'dedir.
Beklenen hatalar `Result`/`Error` ile döner ve Api'de HTTP koduna çevrilir
(Validation → 400, NotFound → 404, Conflict → 409); iş kuralı ihlali (`DomainException`) → 400.

Yeni bir özellik eklerken sıra: Domain'de varlık → Application'da arayüz + sorgu/komut handler'ı
(`DependencyInjection.cs`'e kaydı) → Infrastructure'da uygulaması → Api'de uç nokta.

| Uç nokta                       | Yetki   | Açıklama |
|--------------------------------|---------|----------|
| `GET /api/health`              | herkes  | PostgreSQL / Redis / RabbitMQ durumu |
| `GET /api/categories`          | herkes  | Kategoriler + üst gruplar (boya, hırdavat ...) |
| `GET /api/products`            | herkes  | Liste. Parametreler `/urunler` sayfasıyla aynı: `q`, `kategori`, `marka`, `min`, `max`, `indirim=1`, `sirala` (`onerilen`, `populer`, `yeni`, `fiyat-artan`, `fiyat-azalan`, `puan`), `page`, `pageSize` |
| `GET /api/products/{id}`       | herkes  | Ürün detayı (açıklama, özellikler, görseller) |
| `GET /api/products/{id}/reviews` | herkes | Onaylı yorumlar + puan özeti (`page`); giriş yapılmışsa kendi yorumu |
| `POST /api/products/{id}/reviews` | giriş | Yorum yaz / düzenle `{ rating, title?, comment }` → onaya düşer |
| `POST /api/products`           | admin   | Ürün ekle |
| `PUT /api/products/{id}`       | admin   | Ürün güncelle |
| `DELETE /api/products/{id}`    | admin   | Ürün sil |
| `POST /api/orders`             | herkes  | Sipariş ver (misafir ya da üye). Fiyat ve kargo sunucuda hesaplanır, stok düşülür |
| `POST /api/orders/track`       | herkes  | Misafir sipariş takibi: `{ number, email }` (kişisel bilgiler maskeli) |
| `GET /api/me/orders`           | giriş   | Üyenin siparişleri |
| `GET /api/me/orders/{number}`  | giriş   | Üyenin tek siparişi |
| `GET /api/admin/orders`        | admin   | Sipariş listesi: `durum`, `q` (numara/ad/e-posta/telefon), `page`, `pageSize` |
| `GET /api/admin/orders/{number}` | admin | Sipariş detayı + fatura + geçilebilecek durumlar |
| `POST /api/admin/orders/{number}/status` | admin | Durum değiştir `{ status, note, carrier?, trackingNumber? }` (havale onayı, kargo, teslim, iptal). Kargoya verirken firma + takip no zorunlu; iptalde stok geri eklenir |
| `POST /api/admin/uploads`      | admin   | Görsel yükle (multipart, alan `file`; JPG/PNG/WEBP, en fazla 5 MB) → `{ url }`. Marka logosu için `?klasor=brands` |
| `GET /api/files/products/...`  | herkes  | Yüklenen görseller (`uploads` volume'u) |
| `GET /api/admin/categories`    | admin   | Alt kategoriler (ürün sayısıyla) + üst kategoriler |
| `POST /api/admin/categories`   | admin   | Alt kategori ekle `{ slug?, name, sortOrder?, groups: ["boya"] }` (kod boşsa addan üretilir) |
| `PUT/DELETE /api/admin/categories/{slug}` | admin | Alt kategori güncelle / sil (içinde ürün varsa silinmez, 409) |
| `POST /api/admin/category-groups` | admin | Üst kategori ekle `{ slug?, label, sortOrder? }` |
| `PUT/DELETE /api/admin/category-groups/{slug}` | admin | Üst kategori güncelle / sil (alt kategoriler kalır) |
| `GET /api/brands`              | herkes  | Sitede gösterilen markalar `[{ name, logo }]` (ana sayfa bandı, Hakkımızda) |
| `GET/POST /api/admin/brands` · `PUT/DELETE /api/admin/brands/{slug}` | admin | Marka yönetimi `{ name, logoUrl?, sortOrder?, showInBand? }`; ad değişirse ürünlerdeki marka adı da güncellenir |
| `POST /api/contact`            | herkes  | İletişim formu `{ name, email, phone?, subject, orderNumber?, message, kvkk }` (IP başına 10 dk'da 5) |
| `GET /api/admin/messages`      | admin   | Mesajlar: `okunmamis=1`, `page`, `pageSize` → `{ total, unread, items }` |
| `POST /api/admin/messages/{id}/read` · `DELETE /api/admin/messages/{id}` | admin | Okundu/okunmadı `{ read }` · sil |
| `GET /api/admin/reviews`       | admin   | Yorumlar: `durum=bekleyen\|onayli`, `page` → `{ total, pending, items }` |
| `POST /api/admin/reviews/{id}/approve` · `DELETE /api/admin/reviews/{id}` | admin | Yorumu onayla · reddet/sil (ürün puanı yeniden hesaplanır) |
| `GET /api/payments/installments?price=` | herkes | Tutar için kart ailelerine göre taksitler (iyzico; Redis'te 6 saat, IP başına dakikada 60) |
| `POST /api/payments/iyzico/callback` | iyzico | Kart ödemesi dönüşü (form: `token`, sorgu: `no`). Sonucu doğrular, sonuç sayfasına yönlendirir |
| `GET /api/me/profile`          | giriş   | Üyenin profili (kaydı yoksa giriş bilgileriyle doldurulur) |
| `PUT /api/me/profile`          | giriş   | Profili güncelle `{ firstName, lastName, phone?, marketingConsent }` (telefon 05XXXXXXXXX'e çevrilir) |
| `GET/POST /api/me/addresses`   | giriş   | Adres defteri: liste / ekle `{ title, recipientName, phone, city, district, line, postalCode?, isDefault }` |
| `PUT/DELETE /api/me/addresses/{id}` · `POST /api/me/addresses/{id}/default` | giriş | Düzenle / sil / varsayılan yap (hepsi güncel listeyi döner) |
| `GET /api/me`                  | giriş   | Giriş yapmış kullanıcı ve roller (çerez veya Bearer) |
| `GET /api/auth/user`           | herkes  | `{ authenticated, user }` — sayfaların giriş durumu |
| `GET /api/auth/login`          | herkes  | Keycloak girişine yönlendirir (`?returnUrl=/...`) |
| `GET /api/auth/register`       | herkes  | Keycloak kayıt formuna yönlendirir (`?returnUrl=/...`) |
| `GET /api/auth/logout`         | herkes  | Oturumu kapatır (`?returnUrl=/...`) |
| `GET /api/openapi/v1.json`     | herkes  | OpenAPI şeması |

Ürün ekleme/güncelleme/silme `soykok.events` (topic) exchange'ine `product.created`,
`product.updated`, `product.deleted` olaylarını yayınlar.
Sipariş oluşunca `order.created`, durumu değişince `order.status_changed`, iletişim formundan mesaj gelince
`contact.received` yayınlanır.

Sipariş kuralları: tarayıcıdan yalnızca ürün kodu ve adet gelir; fiyat katalogdan okunur.
Kargo 1000 TL altı siparişte 149 TL (`ShippingPolicy`, arayüzde `src/lib/shipping.ts` — ikisi aynı
olmalı). Stok, sipariş kaydıyla aynı transaction'da koşullu `UPDATE` ile düşülür; yetersizse sipariş
kaydedilmez (409). Stok kaydı olmayan ürünler (admin panelinden sonradan eklenenler) stok takibine
girmez. Her sipariş "Ödeme Bekleniyor" durumunda açılır: havalede admin parayı görünce, kartta iyzico
onaylayınca "Sipariş Alındı" olur.

### Erişilebilirlik ve duyarlı tasarım (WCAG 2.2 AA)

- **Akışkan yazı boyutu:** `html { font-size: clamp(100%, 0.875rem + 0.2vw, 112.5%) }`. Küçük ekranda 16px'in
  altına inmez, geniş ekranda 18px'e kadar büyür. Tüm yazılar `rem`; tarayıcı yazı boyutu ayarı ve %200 yakınlaştırma çalışır.
  Sitede 12px'ten küçük yazı yok. Kod yazarken `text-[11px]` gibi sabit piksel kullanmayın; `text-xs` ve üstünü kullanın.
- **Yeniden akış:** 320px genişlikte (≈ %400 yakınlaştırma) hiçbir sayfada yatay kaydırma yok; çok dar ekranda kategori kartları tek sütun.
- **Kontrast:** Metinler en az 4,5:1. `text-gray-400` metin rengi olarak kullanılmıyor (2,6:1); en açık metin `text-gray-500`.
  İndirim rengi `#b42318`, beyaz yazılı butonlar `green-700` / `wood-600`.
- **Klavye:** Her odaklanabilir öğede mavi odak çerçevesi (`:focus-visible`); sayfa başında "İçeriğe geç" linki.
- **Hareket:** Ana slaytta Durdur/Oynat butonu; ürün slaytları kendiliğinden kaymaz; marka şeridi sabit;
  "hareketi azalt" tercihinde animasyonlar kapalı.
- **Dokunma alanı:** Slayt noktaları ve menü/footer linkleri en az 24×24px.

### Örnek katalog

`backend/src/Soykok.Infrastructure/Persistence/Seed/` altındaki örnek katalog yapı malzemeleri mağazasına
göredir: 5 üst kategori (Boya ve Vernik, Hırdavat, Tesisat ve Banyo, İnşaat Malzemeleri, Yapı Kimyasalları),
17 alt kategori, 32 ürün. **Fiyat, marka ve teknik bilgiler örnektir**; yayına almadan önce admin panelinden
gerçekleriyle değiştirin. Ürün görselleri çizimdir (`soykok-web/public/images/products/<ürün-kodu>.jpg`);
gerçek fotoğrafı admin formundan yükleyebilirsiniz.

Eski parke örnek kataloğu (p1–p33) olan bir veritabanında migrator bir kez çalışınca bu ürünler yeni
katalogla değiştirilir (`DatabaseInitializer.ReplaceLegacySampleCatalogAsync`). Siparişler, müşteriler ve
admin panelinden eklenen ürünler korunur.

### Ürün görselleri ve stok

- **Görseller:** Admin ürün formunda "Bilgisayardan yükle" ile yüklenir; API dosyayı `uploads` docker
  volume'una yazar ve `/api/files/products/<rastgele-ad>.jpg` adresini ürüne kaydeder. Eski ürünlerdeki
  `laminat-1.jpg` gibi dosya adları `soykok-web/public/images/products` altından gelmeye devam eder
  (`src/lib/product-image.ts`). Volume'u silmeyin (`docker compose down -v` görselleri de siler).
- **Stok:** Formdaki "Stok adedi" boşsa ürün stok takibine girmez (sınırsız satılır). Sayı girilirse
  siparişte düşer, iptalde geri eklenir; 0 olunca sitede "Tükendi" görünür ve sepete eklenemez.
  Admin formu stoğu yalnızca alan değiştirildiyse gönderir (siparişlerle düşen stok ezilmez).

### Sipariş e-postaları

API içindeki `OrderEmailWorker` RabbitMQ'daki `soykok.order-emails` kuyruğunu dinler ve SMTP ile mail atar:

| Olay | Müşteriye | Size (`ORDER_NOTIFY_EMAIL`) |
|---|---|---|
| Havale ile sipariş verildi | Siparişiniz alındı + IBAN | Yeni sipariş |
| Kart ödemesi onaylandı | Siparişiniz alındı | Yeni sipariş |
| Havale onaylandı (admin "Sipariş Alındı" yaptı) | Ödemeniz alındı | — |
| Hazırlanıyor / Kargoya verildi (takip no ile) / Teslim edildi / İptal | Bilgilendirme | — |

Ayarlar `.env`'deki `SMTP_*` satırları (port 587). Boşsa mail gönderilmez, site normal çalışır.
Gmail için normal şifre değil, Google hesabında açılan **uygulama şifresi** gerekir. Gönderilemeyen
mail bir kez yeniden denenir; hata `docker compose logs api` çıktısında görünür.

### Markalar

Ana sayfadaki **Popüler Markalar** bandı ve Hakkımızda'daki markalar **/admin/markalar** sayfasından yönetilir:
logo yükle / değiştir / kaldır (PNG, JPG, WEBP; şeffaf arka planlı PNG önerilir), marka ekle / sil, sıra ve
"bantta göster". Yüklenen logolar ürün görselleri gibi `uploads` volume'una yazılır. Marka adı değiştirilirse o
markanın ürünlerindeki marka adı da güncellenir; marka silinirse ürünler silinmez. İlk kayıtlar (8 marka ve
markaların kendi sitelerinden alınan logoları, `soykok-web/public/images/brands/`) migration ile gelir.

### Kategoriler

Üst kategori (menü başlığı: Boya ve Vernik, Hırdavat …) ve alt kategori (ürünün kategorisi: İç Cephe Boyası, El Aletleri …)
admin panelinde **/admin/kategoriler** sayfasından eklenir, düzenlenir, silinir. Sitenin mega menüsü, mobil
menüsü, footer'daki kategori sütunu ve arama kutusu bu kayıtlardan üretilir (`soykok-web/src/lib/category-nav.ts`);
değişiklik kaydedilince hemen yansır. Hiçbir üst kategoride olmayan alt kategori menüde tek başına başlık olur.
Kodlar (`/urunler?kategori=...`) üst ve alt kategoriler arasında benzersizdir ve sonradan değişmez.

### Ürün yorumları

- Ürün sayfasındaki **Değerlendirmeler** sekmesinde ortalama puan, 5★–1★ dağılımı ve onaylı yorumlar listelenir.
- Yorumu yalnızca giriş yapmış üye yazar (1–5 puan, isteğe bağlı başlık, 10–2000 karakter yorum). Bir üye bir ürüne
  bir yorum yazar; tekrar yazarsa mevcut yorumu düzenlenir ve **yeniden onaya düşer**.
- Yorum sitede adın baş harfiyle görünür ("Ayşe K."). Üyenin ödemesi alınmış, iptal edilmemiş bir siparişinde ürün
  varsa yorum **Doğrulanmış alıcı** rozetiyle gösterilir.
- Admin **/admin/yorumlar** sayfasından onaylar ya da reddeder (sekmede onay bekleyen sayısı görünür). Onay/silme
  sonrası ürünün ortalama puanı ve yorum sayısı onaylı yorumlardan yeniden hesaplanır; kartlardaki yıldızlar buna göre güncellenir.
- API: `GET|POST /api/products/{id}/reviews`, `GET /api/admin/reviews?durum=bekleyen|onayli`,
  `POST /api/admin/reviews/{id}/approve`, `DELETE /api/admin/reviews/{id}`.

### Kartla ödeme (iyzico)

Kart bilgisi sitemize hiç gelmez; müşteri iyzico'nun 3D Secure ödeme sayfasına yönlendirilir.

1. `POST /api/orders` (`payment: "card"`) siparişi kaydeder, stoğu ayırır, iyzico'da ödeme sayfası açar
   ve adresini cevapta `paymentPageUrl` olarak döner. Arayüz tarayıcıyı oraya gönderir (sepet henüz silinmez).
2. Ödeme bitince iyzico tarayıcıyı `/api/payments/iyzico/callback?no=SYK-...` adresine POST eder.
3. API sonucu token ile iyzico'dan sorar, imzayı ve tutarı kontrol eder:
   - başarılı → sipariş "Sipariş Alındı", tarayıcı `/siparis-tamamlandi?odeme=basarili` (sepet burada boşalır)
   - başarısız → sipariş iptal, stok geri, tarayıcı `/odeme?odeme=basarisiz&mesaj=...` (sepet duruyor)

Kurulum: https://sandbox-merchant.iyzipay.com adresinden test hesabı açın, **Ayarlar > Firma Ayarları**
sayfasındaki API ve güvenlik anahtarını `.env` dosyasındaki `IYZICO_API_KEY` / `IYZICO_SECRET_KEY`
satırlarına yazın, sonra `docker compose up -d --build api`. Anahtarlar boşsa kartla ödeme seçilince
"kullanılamıyor" hatası döner, havale çalışır. Test kartı: `5528 7900 0000 0008`, `12/30`, CVC `123`
(3D ekranında test şifresi sayfada yazar). Canlıda `IYZICO_BASE_URL=https://api.iyzipay.com`, canlı anahtarlar ve
HTTPS'li `PUBLIC_URL` gerekir.

Taksit: ürün sayfasındaki **Taksit Seçenekleri** sekmesi ve fiyat altındaki satır `GET /api/payments/installments`
ile iyzico'nun taksit sorgusundan gelir (kart aileleri: Bonus, World, Maximum …). Sonuç Redis'te 6 saat tutulur.
`.env`'de `IYZICO_*` boşsa taksit bilgisi hiç gösterilmez. Gösterilecek taksitleri sınırlamak için
`Iyzico__EnabledInstallments__0=1`, `__1=3`, `__2=6` … (ödeme ekranı da aynı listeyi kullanır).

Yarım kalan ödemeler: ödeme sayfası açılınca iyzico token'ı siparişe kaydedilir. Müşteri sayfayı kapatırsa
geri dönüş gelmez; `PendingPaymentWorker` 5 dakikada bir, 35 dakikadan eski "Ödeme Bekleniyor" kartlı
siparişleri token ile iyzico'ya sorar: ödenmişse onaylar, ödenmemişse iptal edip stoğu iade eder.

### Arayüz bağlantısı (soykok-web)

| Katman | Nerede | Ne için |
|--------|--------|---------|
| `src/lib/api/` | sunucu + tarayıcı | Tüm uç noktalar tek yerde (`endpoints.ts`); hatalar `ApiError` (ProblemDetails) |
| `src/lib/catalog.ts` | sunucu | Sayfaların ürün/kategori verisi. 60 sn önbellek, `catalog` etiketi. API yoksa `src/data/products.ts` |
| `src/hooks/` (TanStack Query) | tarayıcı | Oturum (`useUser`), admin listeleri ve ekle/güncelle/sil |
| `src/store/` (Zustand) | tarayıcı | Sepet, favoriler, çekmeceler (API'ye gitmeyen durum) |

Admin bir ürünü değiştirince hem tarayıcıdaki sorgular hem sunucudaki `catalog` önbelleği yenilenir
(`src/app/actions/catalog.ts`). Yönetim paneli: http://localhost/admin/urunler (`admin` rolü gerekir).

**Geliştirme** (sayfalar kaydedince anında yenilenir; giriş/çıkış da çalışır):

```bash
# .env:  FRONTEND_UPSTREAM=http://host.docker.internal:3000
docker compose up -d nginx            # api, keycloak ... bağımlılıklarıyla birlikte; frontend konteyneri açılmaz
cd soykok-web && npm install && npm run dev
# → http://localhost  (3000 portunu doğrudan açmayın: Keycloak girişi yalnızca nginx üzerinden çalışır)
```

Production'da `FRONTEND_UPSTREAM` boş bırakılır (varsayılan `http://frontend:3000`) ve
`docker compose up -d --build` Next.js'i de konteynerde çalıştırır. Eski statik arayüz
`soykok-ticaret/` klasöründe duruyor; artık derlenmiyor.

### Hızlı test

```bash
curl http://localhost/api/health
curl "http://localhost/api/products?kategori=boya&sirala=fiyat-artan"
curl "http://localhost/api/products/<urun-kodu>/reviews"

# Geliştirme admin kullanıcısıyla token al (yalnızca yerel ortam için)
TOKEN=$(curl -s http://localhost/auth/realms/soykok/protocol/openid-connect/token \
  -d grant_type=password -d client_id=soykok-dev \
  -d username=admin@soykok.local -d 'password=Admin123!' \
  | sed -E 's/.*"access_token":"([^"]+)".*/\1/')

curl -H "Authorization: Bearer $TOKEN" http://localhost/api/me
```

### Yerelde (Docker olmadan) çalıştırma

.NET 10 SDK gerekir. Altyapı Docker'da çalışırken:

```bash
cd backend
dotnet run --project src/Soykok.Migrator   # bekleyen migration'lar + örnek veri
dotnet run --project src/Soykok.Api
```

`appsettings.json` dosyaları bilgisayardaki portları kullanır (`localhost:5432`, Redis `localhost:6380`);
`.env`'deki şifreleri değiştirdiyseniz buradakileri de güncelleyin. Rider / Visual Studio'da
`backend/Soykok.slnx` dosyasını açın.

## PostgreSQL

İki veritabanı oluşturulur: uygulama için `ecommerce`, Keycloak için `keycloak`
(`postgres/init/01-create-keycloak-db.sh`). Init betikleri yalnızca volume ilk oluşturulurken çalışır;
sıfırdan başlatmak için `docker compose down -v`.

`ecommerce` veritabanının tabloları **migrator** servisi tarafından EF Core migration'larıyla kurulur;
veritabanı boşsa örnek katalog (32 ürün) ve stok (ürün başına 250) yüklenir. Tablolar modül başına
şemalardadır (`catalog`, `customers`, `ordering`, `inventory`, `reviews`, `support`); migration geçmişi
`public.__ef_migrations_history` tablosundadır.

```bash
# Tabloları gör
docker compose exec postgres psql -U ecommerce -d ecommerce -c '\dt *.*'
# Uygulanmış migration'lar
docker compose exec postgres psql -U ecommerce -d ecommerce -c 'select * from public.__ef_migrations_history'
```

### Yeni migration

```bash
./backend/scripts/add-migration.sh <MigrationAdi>   # .NET SDK gerekmez, Docker içinde çalışır
docker compose up -d --build migrator api           # uygula
docker compose logs migrator                        # sonucu gör
```

Ayrıntılar: [`backend/docs/database.md`](backend/docs/database.md).

> Not: Bazı migration'lar .NET SDK olmadan elle yazıldı (Designer dosyası yok). Bu migration'larda
> `migrationBuilder.InsertData(...)` çalışmaz ("There is no entity type mapped to the table ..." hatası);
> başlangıç verisini `migrationBuilder.Sql("INSERT ...")` ile ekleyin.

## Klasör yapısı

```
.
├── docker-compose.yml
├── .env.example
├── nginx/                 # reverse proxy (templates/default.conf.template)
├── keycloak/import/       # realm tanımı
├── postgres/init/         # ilk açılış SQL/betikleri
├── rabbitmq/              # yönetim paneli ayarı
├── backend/               # ASP.NET Core API (Clean Architecture) + Dockerfile
│   ├── docs/database.md   # şema, ER diyagramı, tasarım kararları
│   └── scripts/           # add-migration.sh
├── soykok-web/            # arayüz (Next.js + Tailwind) + Dockerfile
└── soykok-ticaret/        # eski statik arayüz (Vite) — artık kullanılmıyor
```

## Sık kullanılan komutlar

```bash
docker compose logs -f nginx          # log izle
docker compose up -d --force-recreate nginx  # nginx ayarı ya da FRONTEND_UPSTREAM değişince
docker compose up -d --build frontend # arayüzü yeniden derle
docker compose up -d --build migrator api  # API'yi yeniden derle (bekleyen migration'larla)
docker compose logs -f api            # API logları
docker compose logs migrator          # migration sonucu
docker compose down                   # durdur (veriler kalır)
docker compose down -v                # durdur + tüm verileri sil
```

## Sorun giderme

| Belirti | Sebep / çözüm |
|---------|---------------|
| `ports are not available ... 6379` (ya da 5432, 5672) | Bilgisayarda aynı portu kullanan bir servis var (ör. Homebrew Redis). `.env`'de `REDIS_PORT=6380` gibi başka bir port verin; `docker compose up -d` |
| `localhost bağlanmayı reddetti` | nginx çalışmıyor; genelde başka bir servis başlarken hata vermiştir. `docker compose ps -a` ve hatalı servisin `docker compose logs <servis>` çıktısına bakın |
| `api` başlamıyor | Önce migrator'a bakın: `docker compose logs migrator`. API yalnızca migrator başarılıysa açılır |
| Migrator ilk açılışta `Failed executing DbCommand ... __ef_migrations_history` yazıyor | Normal: migration geçmişi tablosu henüz yok, EF hemen ardından oluşturur |
| Migrator `Hiç migration bulunamadı` diyor | `./backend/scripts/add-migration.sh InitialCreate` ile migration oluşturun |
| Eski veritabanıyla migration hatası (`relation ... already exists`) | Veritabanı migration'sız kurulmuş. Yerel ortamda: `docker compose down -v && docker compose up -d --build` |
| Admin panelinde "An error occurred" / 500 | Yeni migration uygulanmamış: `docker compose up -d --build migrator api` |
| Ürün görselleri açılmıyor (403) | Görsel dosyaları Mac'te kısıtlı izinle duruyordu; frontend Dockerfile derlemede düzeltir. `docker compose up -d --build frontend` |
| http://localhost `502 Bad Gateway` | nginx arayüze ulaşamıyor. Geliştirmede `npm run dev` çalışıyor mu? `.env`'deki `FRONTEND_UPSTREAM` doğru mu? Değiştirdiyseniz `docker compose up -d --force-recreate nginx` |
| Sitede `502 Bad Gateway`, ama `/api/health` çalışıyor | Arayüz kapalı: geliştirmede `npm run dev` çalıştığı terminal kapanmış olabilir → `cd soykok-web && npm run dev`. Docker'da: `docker compose up -d --build frontend` |
| Migrator `There is no entity type mapped to the table` | Elle yazılmış migration'da `InsertData` kullanılmış; `migrationBuilder.Sql("INSERT ...")` ile değiştirin |
| Girişten sonra eski siteye / 3000 portuna dönmüyor | Siteyi http://localhost:3000 yerine http://localhost üzerinden açın; Keycloak dönüş adresi nginx'e göre ayarlı |
| `frontend` derlemesi `npm ci` hatası veriyor | `soykok-web/package-lock.json` güncel değil. Bilgisayarda `cd soykok-web && npm install` çalıştırıp tekrar deneyin |
| Keycloak realm değişikliği yansımıyor | Realm dosyası yalnızca realm yoksa içe aktarılır. Yerel ortamda: `docker compose down -v` |
| Logda `libgssapi_krb5.so.2` | Bağlantı dizesinde `GSS Encryption Mode=Disable` yoksa çıkar (Kerberos kullanılmıyor); docker-compose ve appsettings'te ayarlı |
