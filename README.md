# Soykök Ticaret — E-Ticaret Altyapısı (Docker)

Arayüz (`soykok-ticaret/`) ve altyapı servisleri tek bir `docker compose` ile ayağa kalkar.
Tüm trafik **nginx** reverse proxy üzerinden geçer.

| Servis      | İmaj                              | Erişim                                   |
|-------------|-----------------------------------|------------------------------------------|
| nginx       | `nginx:1.27-alpine`               | http://localhost (tek giriş noktası)     |
| frontend    | `soykok-ticaret` (Vite build)     | http://localhost/                        |
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
- Arayüzden OIDC ayarları:
  - Issuer: `http://localhost/auth/realms/soykok`
  - Client ID: `soykok-web`

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
└── soykok-ticaret/        # arayüz (Vite + Tailwind) + Dockerfile
```

## Sık kullanılan komutlar

```bash
docker compose logs -f nginx          # log izle
docker compose restart nginx          # nginx ayarı değişince
docker compose up -d --build frontend # arayüzü yeniden derle
docker compose down                   # durdur (veriler kalır)
docker compose down -v                # durdur + tüm verileri sil
```
