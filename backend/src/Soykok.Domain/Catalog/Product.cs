using Soykok.Domain.Common;

namespace Soykok.Domain.Catalog;

public sealed class Product
{
    private Product() { } // EF Core

    public string Id { get; private set; } = null!;
    public string Name { get; private set; } = null!;
    public string Brand { get; private set; } = null!;
    public string CategorySlug { get; private set; } = null!;

    /// <summary>Fiyat birimi: "mt", "adet" ... Boşsa m².</summary>
    public string? Unit { get; private set; }

    public string Image { get; private set; } = null!;
    public decimal Price { get; private set; }
    public decimal? OldPrice { get; private set; }

    public double Rating { get; private set; }
    public int Reviews { get; private set; }

    public string? Badge { get; private set; }
    /// <summary><see cref="BadgeTypes"/></summary>
    public string? BadgeType { get; private set; }

    public DateOnly AddedAt { get; private set; }
    public int Sales { get; private set; }

    /// <summary>"Önerilen" sıralaması</summary>
    public int SortOrder { get; private set; }

    // --- Detay sayfası ---
    public decimal? BoxM2 { get; private set; }
    public string[] Images { get; private set; } = [];
    public string? Description { get; private set; }
    public string[] Features { get; private set; } = [];
    public List<ProductSpec> Specs { get; private set; } = [];

    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    /// <summary>İndirimde mi? (eski fiyatı var)</summary>
    public bool IsDiscounted => OldPrice is not null;

    public static Product Create(string id, ProductInfo info, int sortOrder, DateTimeOffset now)
    {
        var product = new Product
        {
            Id = Guard.NotEmpty(id, "Ürün kodu"),
            AddedAt = DateOnly.FromDateTime(now.UtcDateTime),
            SortOrder = sortOrder,
            CreatedAt = now,
        };
        product.Apply(info, now);
        return product;
    }

    public void Update(ProductInfo info, DateTimeOffset now) => Apply(info, now);

    /// <summary>Puan, yorum ve satış sayıları (ör. örnek veri ya da sipariş/yorum modülleri).</summary>
    public void SetStatistics(double rating, int reviews, int sales)
    {
        if (rating is < 0 or > 5) throw new DomainException("Puan 0 ile 5 arasında olmalı.");
        if (reviews < 0 || sales < 0) throw new DomainException("Yorum ve satış sayısı negatif olamaz.");
        Rating = rating;
        Reviews = reviews;
        Sales = sales;
    }

    /// <summary>Ürünün kataloğa eklendiği tarih (örnek veri yüklenirken).</summary>
    public void SetAddedAt(DateOnly addedAt) => AddedAt = addedAt;

    private void Apply(ProductInfo info, DateTimeOffset now)
    {
        if (info.Price <= 0)
            throw new DomainException("Fiyat sıfırdan büyük olmalı.");
        if (info.OldPrice is not null && info.OldPrice <= info.Price)
            throw new DomainException("Eski fiyat, fiyattan büyük olmalı.");
        var badgeType = Guard.TrimToNull(info.BadgeType);
        if (badgeType is not null && !BadgeTypes.All.Contains(badgeType))
            throw new DomainException("Geçersiz etiket türü.");

        Name = Guard.NotEmpty(info.Name, "Ürün adı");
        Brand = Guard.NotEmpty(info.Brand, "Marka");
        CategorySlug = Guard.NotEmpty(info.CategorySlug, "Kategori");
        Image = Guard.NotEmpty(info.Image, "Görsel");
        Unit = Guard.TrimToNull(info.Unit);
        Price = info.Price;
        OldPrice = info.OldPrice;
        Badge = Guard.TrimToNull(info.Badge);
        BadgeType = badgeType;
        BoxM2 = info.BoxM2;
        Images = info.Images.ToArray();
        Description = Guard.TrimToNull(info.Description);
        Features = info.Features.ToArray();
        Specs = info.Specs.ToList();
        UpdatedAt = now;
    }
}
