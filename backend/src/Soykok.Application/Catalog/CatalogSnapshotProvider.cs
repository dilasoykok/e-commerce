using Soykok.Application.Catalog.Contracts;
using Soykok.Application.Common.Abstractions;

namespace Soykok.Application.Catalog;

/// <summary>
/// Ürün listesi ve kategoriler için önbellek-öncelikli okuma. Katalog küçük olduğu için
/// tamamı tek parça tutulur; filtre/sıralama bellekte yapılır.
/// </summary>
public sealed class CatalogSnapshotProvider(ICatalogReadRepository repository, ICatalogCache cache)
{
    public async Task<CatalogSnapshot> GetAsync(CancellationToken ct)
    {
        var cached = await cache.GetAsync(ct);
        if (cached is not null)
            return cached;

        var products = await repository.ListProductsAsync(ct);
        var categories = await repository.ListCategoriesAsync(ct);
        var groups = await repository.ListCategoryGroupsAsync(ct);
        var stock = await repository.ListStockAsync(ct);

        var snapshot = new CatalogSnapshot(
            products.Select(p => ProductListItem.From(p, stock.TryGetValue(p.Id, out var q) ? q : null)).ToList(),
            categories.Select(c => new CategoryItem(c.Slug, c.Name)).ToList(),
            groups.Select(g => new CategoryGroupItem(g.Slug, g.Label, g.CategorySlugs)).ToList());

        await cache.SetAsync(snapshot, ct);
        return snapshot;
    }

    public Task InvalidateAsync(CancellationToken ct) => cache.InvalidateAsync(ct);
}
