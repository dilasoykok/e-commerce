# Soykök Ticaret — E-Ticaret Altyapısı (Docker)

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

### Site girişi nasıl çalışır

1. `hesap.html`'deki **Giriş Yap / Kayıt Ol** butonları `/api/auth/login` ya da `/api/auth/register`'a gider.
2. Backend tarayıcıyı Keycloak'ın giriş/kayıt sayfasına yönlendirir; şifre siteye hiç gelmez.
3. Keycloak `/api/auth/callback`'e döner; backend **HttpOnly** `soykok.session` çerezi verir.
   Oturum bilgisi (kullanıcı, roller, token'lar) **Redis**'te tutulur, çerez yalnızca anahtarı taşır.
4. Sayfalar giriş durumunu `GET /api/auth/user` ile öğrenir (`src/js/store/session.js`).
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
    │   ├── Catalog/             # Product, Category, CategoryGroup
    │   ├── Customers/           # Customer, CustomerAddress, FavoriteProduct
    │   ├── Ordering/            # Order, OrderItem, OrderStatusChange (durum geçişleri)
    │   ├── Inventory/           # StockItem
    │   ├── Reviews/             # ProductReview
    │   └── Common/              # PostalAddress, InvoiceInfo, DomainException
    ├── Soykok.Application/      # kullanım senaryoları — yalnızca Domain'e bağlı
    │   ├── Common/              # Result/Error, IQueryHandler/ICommandHandler, arayüzler (repository, cache, olay)
    │   └── Catalog/             # Queries (GetProducts ...), Commands (CreateProduct ...), Contracts (DTO)
    ├── Soykok.Infrastructure/   # arayüzlerin uygulamaları — Application'a bağlı
    │   ├── Persistence/         # EF Core DbContext, konfigürasyonlar, migration'lar, repository'ler, örnek veri
    │   ├── Caching/             # Redis katalog önbelleği
    │   ├── Messaging/           # RabbitMQ olay yayıncısı
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
| `GET /api/categories`          | herkes  | Kategoriler + üst gruplar (parke, aksesuar ...) |
| `GET /api/products`            | herkes  | Liste. Parametreler `urunler.html` ile aynı: `q`, `kategori`, `marka`, `min`, `max`, `indirim=1`, `sirala` (`onerilen`, `populer`, `yeni`, `fiyat-artan`, `fiyat-azalan`, `puan`), `page`, `pageSize` |
| `GET /api/products/{id}`       | herkes  | Ürün detayı (açıklama, özellikler, görseller) |
| `POST /api/products`           | admin   | Ürün ekle |
| `PUT /api/products/{id}`       | admin   | Ürün güncelle |
| `DELETE /api/products/{id}`    | admin   | Ürün sil |
| `POST /api/orders`             | herkes  | Sipariş ver (misafir ya da üye). Fiyat ve kargo sunucuda hesaplanır, stok düşülür |
| `POST /api/orders/track`       | herkes  | Misafir sipariş takibi: `{ number, email }` (kişisel bilgiler maskeli) |
| `GET /api/me/orders`           | giriş   | Üyenin siparişleri |
| `GET /api/me/orders/{number}`  | giriş   | Üyenin tek siparişi |
| `GET /api/admin/orders`        | admin   | Sipariş listesi: `durum`, `q` (numara/ad/e-posta/telefon), `page`, `pageSize` |
| `GET /api/admin/orders/{number}` | admin | Sipariş detayı + fatura + geçilebilecek durumlar |
| `POST /api/admin/orders/{number}/status` | admin | Durum değiştir `{ status, note }` (havale onayı, kargo, teslim, iptal). İptalde stok geri eklenir |
| `GET /api/admin/categories`    | admin   | Alt kategoriler (ürün sayısıyla) + üst kategoriler |
| `POST /api/admin/categories`   | admin   | Alt kategori ekle `{ slug?, name, sortOrder?, groups: ["parke"] }` (kod boşsa addan üretilir) |
| `PUT/DELETE /api/admin/categories/{slug}` | admin | Alt kategori güncelle / sil (içinde ürün varsa silinmez, 409) |
| `POST /api/admin/category-groups` | admin | Üst kategori ekle `{ slug?, label, sortOrder? }` |
| `PUT/DELETE /api/admin/category-groups/{slug}` | admin | Üst kategori güncelle / sil (alt kategoriler kalır) |
| `POST /api/payments/iyzico/callback` | iyzico | Kart ödemesi dönüşü (form: `token`, sorgu: `no`). Sonucu doğrular, sonuç sayfasına yönlendirir |
| `GET /api/me`                  | giriş   | Giriş yapmış kullanıcı ve roller (çerez veya Bearer) |
| `GET /api/auth/user`           | herkes  | `{ authenticated, user }` — sayfaların giriş durumu |
| `GET /api/auth/login`          | herkes  | Keycloak girişine yönlendirir (`?returnUrl=/...`) |
| `GET /api/auth/register`       | herkes  | Keycloak kayıt formuna yönlendirir (`?returnUrl=/...`) |
| `GET /api/auth/logout`         | herkes  | Oturumu kapatır (`?returnUrl=/...`) |
| `GET /api/openapi/v1.json`     | herkes  | OpenAPI şeması |

Ürün ekleme/güncelleme/silme `soykok.events` (topic) exchange'ine `product.created`,
`product.updated`, `product.deleted` olaylarını yayınlar.
Sipariş oluşunca `order.created`, durumu değişince `order.status_changed` yayınlanır.

Sipariş kuralları: tarayıcıdan yalnızca ürün kodu ve adet gelir; fiyat katalogdan okunur.
Kargo 1000 TL altı siparişte 149 TL (`ShippingPolicy`, arayüzde `src/lib/shipping.ts` — ikisi aynı
olmalı). Stok, sipariş kaydıyla aynı transaction'da koşullu `UPDATE` ile düşülür; yetersizse sipariş
kaydedilmez (409). Stok kaydı olmayan ürünler (admin panelinden sonradan eklenenler) stok takibine
girmez. Her sipariş "Ödeme Bekleniyor" durumunda açılır: havalede admin parayı görünce, kartta iyzico
onaylayınca "Sipariş Alındı" olur.

### Kategoriler

Üst kategori (menü başlığı: Parke, Aksesuarlar …) ve alt kategori (ürünün kategorisi: Laminat, Masif …)
admin panelinde **/admin/kategoriler** sayfasından eklenir, düzenlenir, silinir. Sitenin mega menüsü, mobil
menüsü, footer'daki kategori sütunu ve arama kutusu bu kayıtlardan üretilir (`soykok-web/src/lib/category-nav.ts`);
değişiklik kaydedilince hemen yansır. Hiçbir üst kategoride olmayan alt kategori menüde tek başına başlık olur.
Kodlar (`/urunler?kategori=...`) üst ve alt kategoriler arasında benzersizdir ve sonradan değişmez.

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

Eksik: ödeme sayfasında tarayıcı kapanırsa sipariş "Ödeme Bekleniyor"da kalır (stok ayrılı). Şimdilik
admin iyzico panelinden kontrol edip durumu elle değiştirir; ileride token saklanıp zamanlanmış kontrol
ya da iyzico bildirimi (webhook) eklenecek.

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
curl "http://localhost/api/products?kategori=parke&sirala=fiyat-artan"

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
veritabanı boşsa örnek katalog (33 ürün) ve stok (ürün başına 250) yüklenir. Tablolar modül başına
şemalardadır (`catalog`, `customers`, `ordering`, `inventory`, `reviews`); migration geçmişi
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
| Ürün görselleri açılmıyor (403) | Görsel dosyaları Mac'te kısıtlı izinle duruyordu; frontend Dockerfile derlemede düzeltir. `docker compose up -d --build frontend` |
| http://localhost `502 Bad Gateway` | nginx arayüze ulaşamıyor. Geliştirmede `npm run dev` çalışıyor mu? `.env`'deki `FRONTEND_UPSTREAM` doğru mu? Değiştirdiyseniz `docker compose up -d --force-recreate nginx` |
| Girişten sonra eski siteye / 3000 portuna dönmüyor | Siteyi http://localhost:3000 yerine http://localhost üzerinden açın; Keycloak dönüş adresi nginx'e göre ayarlı |
| `frontend` derlemesi `npm ci` hatası veriyor | `soykok-web/package-lock.json` güncel değil. Bilgisayarda `cd soykok-web && npm install` çalıştırıp tekrar deneyin |
| Keycloak realm değişikliği yansımıyor | Realm dosyası yalnızca realm yoksa içe aktarılır. Yerel ortamda: `docker compose down -v` |
| Logda `libgssapi_krb5.so.2` | Bağlantı dizesinde `GSS Encryption Mode=Disable` yoksa çıkar (Kerberos kullanılmıyor); docker-compose ve appsettings'te ayarlı |
