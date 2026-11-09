# Veritabanı Şeması

PostgreSQL 17. Her modül kendi şemasında durur; tablo ve kolon adları `snake_case`.
Şema EF Core migration'larıyla yönetilir (`src/Soykok.Infrastructure/Persistence/Migrations`).

| Şema        | Tablolar | Açıklama |
|-------------|----------|----------|
| `catalog`   | `categories`, `category_groups`, `products` | Ürün kataloğu |
| `customers` | `customers`, `customer_addresses`, `favorite_products` | Üye profili (kimlik Keycloak'ta), kayıtlı adresler, favoriler |
| `ordering`  | `orders`, `order_items`, `order_status_history` | Siparişler |
| `inventory` | `stock_items` | Ürün stokları |
| `reviews`   | `product_reviews` | Ürün yorumları |
| `public`    | `__ef_migrations_history` | Uygulanan migration'lar |

## İlişki diyagramı

```mermaid
erDiagram
    CATEGORIES ||--o{ PRODUCTS : "kategori"
    PRODUCTS ||--o| STOCK_ITEMS : "stok"
    PRODUCTS ||--o{ PRODUCT_REVIEWS : "yorum"
    PRODUCTS ||--o{ FAVORITE_PRODUCTS : "favori"
    CUSTOMERS ||--o{ CUSTOMER_ADDRESSES : "adres"
    CUSTOMERS ||--o{ FAVORITE_PRODUCTS : "favori"
    CUSTOMERS ||--o{ PRODUCT_REVIEWS : "yazar"
    CUSTOMERS |o--o{ ORDERS : "üye siparişi"
    ORDERS ||--|{ ORDER_ITEMS : "kalem"
    ORDERS ||--|{ ORDER_STATUS_HISTORY : "durum"

    CATEGORIES {
        varchar slug PK
        varchar name
        int sort_order
    }
    CATEGORY_GROUPS {
        varchar slug PK
        varchar label
        text[] category_slugs
        int sort_order
    }
    PRODUCTS {
        varchar id PK
        varchar name
        varchar brand
        varchar category_slug FK
        varchar unit
        varchar image
        numeric price
        numeric old_price
        float rating
        int reviews
        varchar badge
        varchar badge_type
        date added_at
        int sales
        int sort_order
        numeric box_m2
        text[] images
        text description
        text[] features
        jsonb specs
        timestamptz created_at
        timestamptz updated_at
    }
    STOCK_ITEMS {
        varchar product_id PK, FK
        int quantity
        timestamptz updated_at
    }
    CUSTOMERS {
        uuid id PK
        varchar identity_id UK "Keycloak sub"
        varchar email
        varchar first_name
        varchar last_name
        varchar phone
        bool marketing_consent
        timestamptz created_at
        timestamptz updated_at
    }
    CUSTOMER_ADDRESSES {
        uuid id PK
        uuid customer_id FK
        varchar title
        varchar recipient_name
        varchar phone
        varchar address_city
        varchar address_district
        varchar address_line
        varchar address_postal_code
        varchar invoice_type
        varchar invoice_company_name
        varchar invoice_tax_office
        varchar invoice_tax_number
        bool is_default
        timestamptz created_at
    }
    FAVORITE_PRODUCTS {
        uuid customer_id PK, FK
        varchar product_id PK, FK
        timestamptz created_at
    }
    ORDERS {
        uuid id PK
        varchar number UK "SYK-261109-4821"
        uuid customer_id FK "misafirde boş"
        varchar buyer_email
        varchar buyer_first_name
        varchar buyer_last_name
        varchar buyer_phone
        varchar delivery_method "Cargo | Store"
        varchar shipping_address_city
        varchar shipping_address_district
        varchar shipping_address_line
        varchar shipping_address_postal_code
        varchar delivery_note
        varchar invoice_type "Individual | Corporate"
        varchar invoice_company_name
        varchar invoice_tax_office
        varchar invoice_tax_number
        varchar payment_method "Card | Transfer"
        varchar status
        numeric subtotal
        numeric shipping_fee
        numeric total
        bool marketing_consent
        timestamptz placed_at
        timestamptz updated_at
    }
    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        varchar product_id "FK yok: anlık kopya"
        varchar product_name
        varchar brand
        varchar image
        varchar unit
        numeric unit_price
        int quantity
        numeric line_total
    }
    ORDER_STATUS_HISTORY {
        uuid id PK
        uuid order_id FK
        varchar status
        varchar note
        timestamptz changed_at
    }
    PRODUCT_REVIEWS {
        uuid id PK
        varchar product_id FK
        uuid customer_id FK
        varchar author_name
        int rating "1-5"
        varchar title
        varchar comment
        bool is_approved
        timestamptz created_at
        timestamptz approved_at
    }
```

## Tasarım kararları

- **Kimlik Keycloak'ta.** `customers` tablosunda şifre yoktur; `identity_id` Keycloak token'ındaki `sub`
  değeridir (benzersiz).
- **Sipariş anlık kopya tutar.** Alıcı, adres, fatura ve ürün bilgileri (`order_items.product_name`,
  `unit_price` ...) sipariş anındaki haliyle saklanır. Ürün fiyatı değişse ya da ürün silinse de geçmiş
  siparişler bozulmaz; bu yüzden `order_items.product_id` üzerinde FK yoktur.
- **Misafir siparişi.** `orders.customer_id` boş olabilir. Misafir sipariş takibi numara + e-posta ile
  yapılır (`buyer_email` index'li). Üye silinirse siparişleri silinmez, `customer_id` boşalır.
- **Durum geçmişi.** Her durum değişikliği `order_status_history`'ye yazılır (takip ekranındaki adımlar).
  İzin verilen geçişler `Order` varlığındadır:
  `AwaitingPayment → Received → Preparing → Shipped → Delivered`, teslimattan önce `Cancelled`.
- **Para** `numeric(12,2)`; **tarihler** `timestamptz` (UTC); **kimlikler** `uuid` v7 (zamana göre sıralı,
  index'te dağılmaz). Ürün ve kategori kodları frontend ile uyumlu olsun diye metin (`p1`, `laminat`).
- **Enum'lar metin** olarak saklanır (`'Received'`), sorgularda okunabilir olsun diye.
- **Veri bütünlüğü** check constraint'lerle de korunur: `total = subtotal + shipping_fee`,
  `line_total = unit_price * quantity`, `quantity` 1–999, `stock_items.quantity >= 0`, `rating` 1–5.
- **Yorumlar** varsayılan olarak onaysızdır (`is_approved = false`); bir müşteri bir ürüne tek yorum yazabilir.
  `products.rating` ve `products.reviews` onaylı yorumlardan hesaplanan özet değerlerdir.

## Migration iş akışı

```bash
# 1) Domain'de varlığı / EF yapılandırmasını değiştir
# 2) Migration oluştur (bilgisayarda .NET gerekmez, Docker içinde çalışır)
./backend/scripts/add-migration.sh AddSomething
# 3) Oluşan dosyayı gözden geçir: backend/src/Soykok.Infrastructure/Persistence/Migrations/
# 4) Uygula
docker compose up -d --build migrator api
```

`migrator` servisi bekleyen migration'ları uygular, veritabanı boşsa örnek kataloğu ve stoğu yükler,
sonra kapanır. `api` servisi yalnızca migrator başarıyla biterse başlar. Migrator logları:
`docker compose logs migrator`.
