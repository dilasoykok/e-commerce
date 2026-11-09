using System.Globalization;
using Soykok.Application.Catalog.Contracts;
using Soykok.Application.Common.Messaging;

namespace Soykok.Application.Catalog.Queries;

/// <summary>
/// Ürün listesi. Parametreler urunler.html'in adres çubuğundakilerle aynı anlamdadır:
/// Categories ve Brands virgülle ayrılmış liste; Categories üst grup da olabilir (ör. "parke").
/// </summary>
public sealed record GetProductsQuery(
    string? Search = null,
    string? Categories = null,
    string? Brands = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    bool OnlyDiscounted = false,
    string? Sort = null,
    int Page = 1,
    int PageSize = 24);

public static class ProductSorts
{
    public const string Recommended = "onerilen";
    public const string Popular = "populer";
    public const string Newest = "yeni";
    public const string PriceAsc = "fiyat-artan";
    public const string PriceDesc = "fiyat-azalan";
    public const string Rating = "puan";
}

public sealed class GetProductsHandler(CatalogSnapshotProvider catalog) : IQueryHandler<GetProductsQuery, ProductPage>
{
    public const int MaxPageSize = 100;
    private static readonly CultureInfo Tr = CultureInfo.GetCultureInfo("tr-TR");

    public async Task<ProductPage> HandleAsync(GetProductsQuery query, CancellationToken ct)
    {
        var snapshot = await catalog.GetAsync(ct);
        var categoryNames = snapshot.Categories.ToDictionary(c => c.Slug, c => c.Name);
        var groups = snapshot.Groups.ToDictionary(g => g.Slug, g => g.Categories);

        // "parke" → laminat, masif, vinil ...
        var categories = Split(query.Categories)
            .SelectMany(c => groups.TryGetValue(c, out var members) ? members : new[] { c })
            .Where(categoryNames.ContainsKey)
            .ToHashSet();
        var brands = Split(query.Brands).ToHashSet();
        var search = Normalize(query.Search);

        IEnumerable<ProductListItem> result = snapshot.Products.Where(p =>
        {
            if (search.Length > 0)
            {
                var haystack = Normalize($"{p.Name} {p.Brand} {categoryNames.GetValueOrDefault(p.Category)}");
                if (!haystack.Contains(search, StringComparison.Ordinal)) return false;
            }
            if (categories.Count > 0 && !categories.Contains(p.Category)) return false;
            if (brands.Count > 0 && !brands.Contains(p.Brand)) return false;
            if (query.MinPrice is not null && p.Price < query.MinPrice) return false;
            if (query.MaxPrice is not null && p.Price > query.MaxPrice) return false;
            if (query.OnlyDiscounted && p.OldPrice is null) return false;
            return true;
        });

        result = query.Sort switch
        {
            ProductSorts.Popular => result.OrderByDescending(p => p.Sales),
            ProductSorts.Newest => result.OrderByDescending(p => p.AddedAt),
            ProductSorts.PriceAsc => result.OrderBy(p => p.Price),
            ProductSorts.PriceDesc => result.OrderByDescending(p => p.Price),
            ProductSorts.Rating => result.OrderByDescending(p => p.Rating).ThenByDescending(p => p.Reviews),
            _ => result.OrderBy(p => p.SortOrder),
        };

        var list = result.ToList();
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);
        var items = list.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return new ProductPage(list.Count, page, pageSize, items);
    }

    private static IEnumerable<string> Split(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? Array.Empty<string>()
            : value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    /// <summary>Türkçe küçük harfe çevirir ("İ/ı" aramada sorun çıkarmaz) — frontend'deki normalize ile aynı.</summary>
    private static string Normalize(string? text) => (text ?? string.Empty).ToLower(Tr).Trim();
}
