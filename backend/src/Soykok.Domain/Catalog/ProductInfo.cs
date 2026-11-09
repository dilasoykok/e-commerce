namespace Soykok.Domain.Catalog;

/// <summary>Ürünün yönetici tarafından düzenlenebilen bilgileri.</summary>
public sealed record ProductInfo(
    string Name,
    string Brand,
    string CategorySlug,
    string? Unit,
    string Image,
    decimal Price,
    decimal? OldPrice,
    string? Badge,
    string? BadgeType,
    decimal? BoxM2,
    IReadOnlyList<string> Images,
    string? Description,
    IReadOnlyList<string> Features,
    IReadOnlyList<ProductSpec> Specs);
