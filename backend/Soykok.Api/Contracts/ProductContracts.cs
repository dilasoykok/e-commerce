using Soykok.Api.Domain;

namespace Soykok.Api.Contracts;

// Alan adları frontend'deki src/js/data/products.js ile birebir aynı tutuldu,
// böylece arayüz statik veriden API'ye geçerken kart/detay kodu değişmez.

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

/// <summary>Ürün ekleme/güncelleme (yalnızca admin rolü).</summary>
public sealed record ProductUpsertRequest(
    string? Id,
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
    Dictionary<string, string>? Specs);

public sealed record CategoryItem(string Slug, string Name);
public sealed record CategoryGroupItem(string Slug, string Label, string[] Categories);
public sealed record CatalogCategories(IReadOnlyList<CategoryItem> Categories, IReadOnlyList<CategoryGroupItem> Groups);

/// <summary>RabbitMQ'ya giden ürün olayı.</summary>
public sealed record ProductChangedEvent(string ProductId, string Name, decimal Price, string Change, DateTimeOffset OccurredAt);

/// <summary>Redis'te tutulan katalog görüntüsü (liste + kategoriler).</summary>
public sealed record CatalogSnapshot(
    List<ProductListItem> Products,
    List<CategoryItem> Categories,
    List<CategoryGroupItem> Groups);
