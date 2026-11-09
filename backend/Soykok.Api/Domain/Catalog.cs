namespace Soykok.Api.Domain;

/// <summary>Alt kategori: laminat, masif, supurgelik ...</summary>
public class Category
{
    public required string Slug { get; set; }
    public required string Name { get; set; }
    public int SortOrder { get; set; }
}

/// <summary>Üst kategori (parke, aksesuar ...) — birden çok alt kategoriyi kapsar.</summary>
public class CategoryGroup
{
    public required string Slug { get; set; }
    public required string Label { get; set; }
    public string[] CategorySlugs { get; set; } = [];
    public int SortOrder { get; set; }
}

/// <summary>Ürün özellik satırı: "Kalınlık" → "8 mm". Sırası korunur.</summary>
public sealed record ProductSpec(string Label, string Value);

public class Product
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Brand { get; set; }
    public required string CategorySlug { get; set; }

    /// <summary>Fiyat birimi: "mt", "adet" ... Boşsa m².</summary>
    public string? Unit { get; set; }

    public required string Image { get; set; }
    public decimal Price { get; set; }
    public decimal? OldPrice { get; set; }

    public double Rating { get; set; }
    public int Reviews { get; set; }

    public string? Badge { get; set; }
    /// <summary>sale | new | info</summary>
    public string? BadgeType { get; set; }

    public DateOnly AddedAt { get; set; }
    public int Sales { get; set; }

    /// <summary>"Önerilen" sıralaması</summary>
    public int SortOrder { get; set; }

    // --- Detay sayfası ---
    public decimal? BoxM2 { get; set; }
    public string[] Images { get; set; } = [];
    public string? Description { get; set; }
    public string[] Features { get; set; } = [];
    public List<ProductSpec> Specs { get; set; } = [];

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
