using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Soykok.Api.Contracts;
using Soykok.Api.Data;

namespace Soykok.Api.Infrastructure;

/// <summary>
/// Ürün listesi ve kategorileri Redis'te önbelleğe alır. Katalog küçük olduğu için
/// tamamı tek anahtarda tutulur; filtre/sıralama bellekte yapılır.
/// Ürün eklenince/güncellenince/silinince <see cref="InvalidateAsync"/> çağrılır.
/// </summary>
public sealed class CatalogCache(
    AppDbContext db,
    IDistributedCache cache,
    IConfiguration config,
    ILogger<CatalogCache> log)
{
    private const string Key = "catalog:v1";

    public async Task<CatalogSnapshot> GetAsync(CancellationToken ct)
    {
        try
        {
            var cached = await cache.GetStringAsync(Key, ct);
            if (cached is not null)
                return JsonSerializer.Deserialize<CatalogSnapshot>(cached, JsonSerializerOptions.Web)!;
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "Redis'ten katalog okunamadı, veritabanına gidiliyor");
        }

        var snapshot = await LoadAsync(ct);

        try
        {
            var minutes = config.GetValue("Catalog:CacheMinutes", 10);
            await cache.SetStringAsync(Key, JsonSerializer.Serialize(snapshot, JsonSerializerOptions.Web),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(minutes) },
                ct);
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "Katalog Redis'e yazılamadı");
        }

        return snapshot;
    }

    public async Task InvalidateAsync(CancellationToken ct)
    {
        try
        {
            await cache.RemoveAsync(Key, ct);
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "Katalog önbelleği temizlenemedi");
        }
    }

    private async Task<CatalogSnapshot> LoadAsync(CancellationToken ct)
    {
        var products = await db.Products.AsNoTracking()
            .OrderBy(p => p.SortOrder)
            .ToListAsync(ct);

        var categories = await db.Categories.AsNoTracking()
            .OrderBy(c => c.SortOrder)
            .Select(c => new CategoryItem(c.Slug, c.Name))
            .ToListAsync(ct);

        var groups = await db.CategoryGroups.AsNoTracking()
            .OrderBy(g => g.SortOrder)
            .Select(g => new CategoryGroupItem(g.Slug, g.Label, g.CategorySlugs))
            .ToListAsync(ct);

        return new CatalogSnapshot(products.Select(ProductListItem.From).ToList(), categories, groups);
    }
}
