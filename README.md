# Soykök Ticaret — E-Ticaret Altyapısı (Docker)

Arayüz (`soykok-ticaret/`) ve altyapı servisleri tek bir `docker compose` ile ayağa kalkar.
Tüm trafik **nginx** reverse proxy üzerinden geçer.

| Servis      | İmaj                              | Erişim                                   |
|-------------|-----------------------------------|------------------------------------------|
| nginx       | `nginx:1.27-alpine`               | http://localhost (tek giriş noktası)     |
| frontend    | `soykok-ticaret` (Vite build)     | http://localhost/                        |
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
  - Client: **soykok-web** (public, Authorization Code + PKCE)
  - Roller: `customer` (varsayılan), `admin`
  - Client: **soykok-dev** — yalnızca yerel API testi için şifreyle token alma (password grant)
  - Geliştirme kullanıcısı: `admin@soykok.local` / `Admin123!` (rol: admin) — **canlıya çıkmadan silin**
  - Token'lara `soykok-api` audience'ı eklenir (API bunu doğrular)
- Realm dosyası yalnızca realm **yoksa** içe aktarılır. Değişiklikten sonra yeniden yüklemek için
  `docker compose down -v && docker compose up -d --build` (tüm yerel veriler silinir).
- Arayüzden OIDC ayarları:
  - Issuer: `http://localhost/auth/realms/soykok`
  - Client ID: `soykok-web`

## Backend API (`backend/Soykok.Api`)

ASP.NET Core minimal API. PostgreSQL (EF Core), Redis (katalog önbelleği), RabbitMQ (olaylar) ve
Keycloak (JWT) bağlı. İlk açılışta tabloları kurar ve `Data/Seed/*.json` içindeki örnek kataloğu
yükler (frontend'deki `src/js/data/products.js`'ten üretildi; alan adları aynı).

| Uç nokta                       | Yetki   | Açıklama |
|--------------------------------|---------|----------|
| `GET /api/health`              | herkes  | PostgreSQL / Redis / RabbitMQ durumu |
| `GET /api/categories`          | herkes  | Kategoriler + üst gruplar (parke, aksesuar ...) |
| `GET /api/products`            | herkes  | Liste. Parametreler `urunler.html` ile aynı: `q`, `kategori`, `marka`, `min`, `max`, `indirim=1`, `sirala` (`onerilen`, `populer`, `yeni`, `fiyat-artan`, `fiyat-azalan`, `puan`), `page`, `pageSize` |
| `GET /api/products/{id}`       | herkes  | Ürün detayı (açıklama, özellikler, görseller) |
| `POST /api/products`           | admin   | Ürün ekle |
| `PUT /api/products/{id}`       | admin   | Ürün güncelle |
| `DELETE /api/products/{id}`    | admin   | Ürün sil |
| `GET /api/me`                  | giriş   | Token'daki kullanıcı ve roller |
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

Altyapı Docker'da çalışırken: `cd backend/Soykok.Api && dotnet run`.
`appsettings.json` localhost portlarını kullanır (Redis: 6380).

## PostgreSQL

İki veritabanı oluşturulur: uygulama için `ecommerce`, Keycloak için `keycloak`
(`postgres/init/01-create-keycloak-db.sh`). Init betikleri yalnızca volume ilk oluşturulurken çalışır;
sıfırdan başlatmak için `docker compose down -v`.

## Klasör yapısı

```
.
├── docker-compose.yml
├── .env.example
├── nginx/                 # reverse proxy
├── keycloak/import/       # realm tanımı
├── postgres/init/         # ilk açılış SQL/betikleri
├── rabbitmq/              # yönetim paneli ayarı
├── backend/               # ASP.NET Core API + Dockerfile
└── soykok-ticaret/        # arayüz (Vite + Tailwind) + Dockerfile
```

## Sık kullanılan komutlar

```bash
docker compose logs -f nginx          # log izle
docker compose restart nginx          # nginx ayarı değişince
docker compose up -d --build frontend # arayüzü yeniden derle
docker compose up -d --build api      # API'yi yeniden derle
docker compose logs -f api            # API logları
docker compose down                   # durdur (veriler kalır)
docker compose down -v                # durdur + tüm verileri sil
```
