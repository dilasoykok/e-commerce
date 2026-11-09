# Soykök Ticaret — E-Ticaret Altyapısı (Docker)

Arayüz (`soykok-ticaret/`) ve altyapı servisleri tek bir `docker compose` ile ayağa kalkar.
Tüm trafik **nginx** reverse proxy üzerinden geçer.

| Servis      | İmaj                              | Erişim                                   |
|-------------|-----------------------------------|------------------------------------------|
| nginx       | `nginx:1.27-alpine`               | http://localhost (tek giriş noktası)     |
| frontend    | `soykok-ticaret` (Vite build)     | http://localhost/                        |
| migrator    | `backend` (EF Core migrations)    | API'den önce çalışır ve kapanır          |
| api         | `backend` (ASP.NET Core, .NET 10) | http://localhost/api/                    |
| Keycloak    | `quay.io/keycloak/keycloak:26.0`  | http://localhost/auth/admin              |
| PostgreSQL  | `postgres:17-alpine`              | `127.0.0.1:5432`                         |
| Redis       | `redis:7-alpine`                  | `127.0.0.1:6379`                         |
| RabbitMQ    | `rabbitmq:4-management-alpine`    | AMQP `127.0.0.1:5672`, panel http://localhost/rabbitmq/ |

PostgreSQL, Redis ve RabbitMQ (AMQP) yalnızca `127.0.0.1`'e açılır; dışarıdan erişilemez.

## Kurulum

```bash
cp .env.example .env      # şifreleri değiştirin
docker compose up -d --build
docker compose ps
```

İlk açılışta Keycloak'ın hazır olması ~30-60 sn sürebilir: `docker compose logs -f keycloak`

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
    │   └── Catalog/             # Product, Category, CategoryGroup ...
    ├── Soykok.Application/      # kullanım senaryoları — yalnızca Domain'e bağlı
    │   ├── Common/              # Result/Error, IQueryHandler/ICommandHandler, arayüzler (repository, cache, olay)
    │   └── Catalog/             # Queries (GetProducts ...), Commands (CreateProduct ...), Contracts (DTO)
    ├── Soykok.Infrastructure/   # arayüzlerin uygulamaları — Application'a bağlı
    │   ├── Persistence/         # EF Core DbContext, konfigürasyonlar, repository'ler, örnek veri
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
| `GET /api/me`                  | giriş   | Giriş yapmış kullanıcı ve roller (çerez veya Bearer) |
| `GET /api/auth/user`           | herkes  | `{ authenticated, user }` — sayfaların giriş durumu |
| `GET /api/auth/login`          | herkes  | Keycloak girişine yönlendirir (`?returnUrl=/...`) |
| `GET /api/auth/register`       | herkes  | Keycloak kayıt formuna yönlendirir (`?returnUrl=/...`) |
| `GET /api/auth/logout`         | herkes  | Oturumu kapatır (`?returnUrl=/...`) |
| `GET /api/openapi/v1.json`     | herkes  | OpenAPI şeması |

Ürün ekleme/güncelleme/silme `soykok.events` (topic) exchange'ine `product.created`,
`product.updated`, `product.deleted` olaylarını yayınlar.

### Arayüz bağlantısı

Ürün listesi (`urunler.html`), ürün detayı (`urun.html`) ve ana sayfa slider'ları ürünleri
`soykok-ticaret/src/js/store/catalog.js` üzerinden `/api`'den çeker. API'ye ulaşılamazsa
`src/js/data/products.js`'teki statik veriye düşer. `npm run dev` (port 5173) sırasında `/api` ve
`/auth` istekleri Vite proxy'siyle Docker'daki nginx'e (`http://localhost`) yönlendirilir.

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

Altyapı Docker'da çalışırken: `cd backend && dotnet run --project src/Soykok.Api`.
`src/Soykok.Api/appsettings.json` localhost portlarını kullanır (Redis: 6380).
Rider / Visual Studio'da `backend/Soykok.slnx` dosyasını açın.

## PostgreSQL

İki veritabanı oluşturulur: uygulama için `ecommerce`, Keycloak için `keycloak`
(`postgres/init/01-create-keycloak-db.sh`). Init betikleri yalnızca volume ilk oluşturulurken çalışır;
sıfırdan başlatmak için `docker compose down -v`.

`ecommerce` veritabanının tabloları **migrator** servisi tarafından EF Core migration'larıyla kurulur;
veritabanı boşsa örnek katalog (33 ürün) ve stok (ürün başına 250) yüklenir.

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
├── nginx/                 # reverse proxy
├── keycloak/import/       # realm tanımı
├── postgres/init/         # ilk açılış SQL/betikleri
├── rabbitmq/              # yönetim paneli ayarı
├── backend/               # ASP.NET Core API (Clean Architecture) + Dockerfile
└── soykok-ticaret/        # arayüz (Vite + Tailwind) + Dockerfile
```

## Sık kullanılan komutlar

```bash
docker compose logs -f nginx          # log izle
docker compose restart nginx          # nginx ayarı değişince
docker compose up -d --build frontend # arayüzü yeniden derle
docker compose up -d --build migrator api  # API'yi yeniden derle (bekleyen migration'larla)
docker compose logs -f api            # API logları
docker compose down                   # durdur (veriler kalır)
docker compose down -v                # durdur + tüm verileri sil
```
