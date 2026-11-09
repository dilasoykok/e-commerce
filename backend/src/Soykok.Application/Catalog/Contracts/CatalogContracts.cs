using Soykok.Domain.Catalog;

namespace Soykok.Application.Catalog.Contracts;

// Alan adları frontend'deki src/js/data/products.js ile birebir aynı tutuldu,
// böylece arayüz statik veriden API'ye geçerken kart/detay kodu değişmedi.

public sealed record ProductListItem(
    string Id, string Name, string Brand, string Category, string? Unit, string Image,
    decimal Price, decimal? OldPrice, double Rating, int Reviews,
    string? Badge, string? BadgeType, DateOnly AddedAt, int Sales, int SortOrder)
{
    public static ProductListItem From(Product p) => new(
        p.Id, p.Name, p.Brand, p.CategorySlug, p.Unit, p.Image, p.Price, p.OldPrice,
        p.Rating, p.Reviews, p.Badge, p.BadgeType, p.AddedAt, p.Sales, p.SortOrder);
}

public sealed record ProductDetail(
    string Id, string Name, string Brand, string Category, string? Unit, string Image,
    decimal Price, decimal? OldPrice, double Rating, int Reviews,
    string? Badge, string? BadgeType, DateOnly AddedAt, int Sales,
    decimal? BoxM2, string[] Images, string? Description, string[] Features,
    Dictionary<string, string> Specs)
{
    public static ProductDetail From(Product p) => new(
        p.Id, p.Name, p.Brand, p.CategorySlug, p.Unit, p.Image, p.Price, p.OldPrice,
        p.Rating, p.Reviews, p.Badge, p.BadgeType, p.AddedAt, p.Sales,
        p.BoxM2, p.Images, p.Description, p.Features,
        p.Specs.ToDictionary(s => s.Label, s => s.Value));
}

public sealed record ProductPage(int Total, int Page, int PageSize, IReadOnlyList<ProductListItem> Items);

public sealed record CategoryItem(string Slug, string Name);
public sealed record CategoryGroupItem(string Slug, string Label, string[] Categories);
public sealed record CatalogCategories(IReadOnlyList<CategoryItem> Categories, IReadOnlyList<CategoryGroupItem> Groups);

/// <summary>Önbellekte tutulan katalog görüntüsü (liste + kategoriler).</summary>
public sealed record CatalogSnapshot(
    List<ProductListItem> Products,
    List<CategoryItem> Categories,
    List<CategoryGroupItem> Groups);

/// <summary>Ürün ekleme/güncelleme isteği (yalnızca admin).</summary>
public sealed record ProductInput(
    string Name,
    string Brand,
    string Category,
    string? Unit,
    string Image,
    decimal Price,
    decimal? OldPrice,
    string? Badge,
    string? BadgeType,
    decimal? BoxM2,
    string[]? Images,
    string? Description,
    string[]? Features,
    Dictionary<string, string>? Specs)
{
    public ProductInfo ToInfo() => new(
        Name, Brand, Category, Unit, Image, Price, OldPrice, Badge, BadgeType, BoxM2,
        Images ?? Array.Empty<string>(),
        Description,
        Features ?? Array.Empty<string>(),
        (Specs ?? new Dictionary<string, string>()).Select(kv => new ProductSpec(kv.Key, kv.Value)).ToList());
}

/// <summary>Mesaj kuyruğuna giden ürün olayı (product.created / product.updated / product.deleted).</summary>
public sealed record ProductChangedEvent(string ProductId, string Name, decimal Price, string Change, DateTimeOffset OccurredAt);

public static class CatalogEvents
{
    public const string ProductCreated = "product.created";
    public const string ProductUpdated = "product.updated";
    public const string ProductDeleted = "product.deleted";
}
