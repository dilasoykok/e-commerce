using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Soykok.Domain.Catalog;
using Soykok.Domain.Inventory;

namespace Soykok.Infrastructure.Persistence;

/// <summary>
/// Bekleyen EF Core migration'larını uygular ve veritabanı boşsa örnek kataloğu + stoğu yükler.
/// Örnek veri dll'e gömülü Persistence/Seed/*.json dosyalarındadır (frontend'deki products.js'ten üretildi).
/// Docker'da "migrator" servisi tarafından API'den önce çalıştırılır.
/// </summary>
public static class DatabaseInitializer
{
    /// <summary>Örnek veride her ürün için başlangıç stoğu.</summary>
    private const int SeedStockQuantity = 250;

    private sealed record SeedCategory(string Slug, string Name, int SortOrder);
    private sealed record SeedGroup(string Slug, string Label, string[] Categories, int SortOrder);
    private sealed record SeedCatalog(List<SeedCategory> Categories, List<SeedGroup> Groups);

    private sealed record SeedProduct(
        string Id, string Name, string Brand, string Category, string? Unit, string Image,
        decimal Price, decimal? OldPrice, double Rating, int Reviews, string? Badge, string? BadgeType,
        DateOnly AddedAt, int Sales, int SortOrder,
        decimal? BoxM2, string[]? Images, string? Description, string[]? Features, Dictionary<string, string>? Specs);

    /// <summary>PostgreSQL hazır olana kadar birkaç kez dener.</summary>
    public static async Task MigrateAndSeedAsync(this IServiceProvider services, CancellationToken ct = default)
    {
        var log = services.GetRequiredService<ILoggerFactory>().CreateLogger(typeof(DatabaseInitializer));

        // Veritabanına gitmeden: derlemede hiç migration yoksa yeniden denemenin anlamı yok
        using (var scope = services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            if (!db.Database.GetMigrations().Any())
                throw new InvalidOperationException(
                    "Hiç migration bulunamadı. Önce oluşturun: backend/scripts/add-migration.sh InitialCreate");
        }

        for (var attempt = 1; ; attempt++)
        {
            try
            {
                using var scope = services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var clock = scope.ServiceProvider.GetRequiredService<TimeProvider>();

                var pending = (await db.Database.GetPendingMigrationsAsync(ct)).ToList();
                if (pending.Count > 0)
                {
                    log.LogInformation("Uygulanacak migration'lar: {Migrations}", string.Join(", ", pending));
                    await db.Database.MigrateAsync(ct);
                }
                else
                {
                    log.LogInformation("Veritabanı güncel, bekleyen migration yok");
                }

                await SeedCatalogAsync(db, clock, log, ct);
                await SeedStockAsync(db, clock, log, ct);
                return;
            }
            catch (Exception ex) when (attempt < 10)
            {
                log.LogWarning(ex, "Veritabanı hazır değil, tekrar denenecek ({Attempt}/10)", attempt);
                await Task.Delay(TimeSpan.FromSeconds(3), ct);
            }
        }
    }

    private static async Task SeedCatalogAsync(AppDbContext db, TimeProvider clock, ILogger log, CancellationToken ct)
    {
        if (await db.Categories.AnyAsync(ct))
            return;

        var json = JsonSerializerOptions.Web;
        var catalog = await ReadSeedAsync<SeedCatalog>("categories.json", json, ct);
        var products = await ReadSeedAsync<List<SeedProduct>>("products.json", json, ct);
        var now = clock.GetUtcNow();

        db.Categories.AddRange(catalog.Categories.Select(c => new Category(c.Slug, c.Name, c.SortOrder)));
        db.CategoryGroups.AddRange(catalog.Groups.Select(g => new CategoryGroup(g.Slug, g.Label, g.Categories, g.SortOrder)));

        foreach (var p in products)
        {
            var info = new ProductInfo(
                p.Name, p.Brand, p.Category, p.Unit, p.Image, p.Price, p.OldPrice, p.Badge, p.BadgeType, p.BoxM2,
                p.Images ?? Array.Empty<string>(),
                p.Description,
                p.Features ?? Array.Empty<string>(),
                (p.Specs ?? new Dictionary<string, string>()).Select(kv => new ProductSpec(kv.Key, kv.Value)).ToList());

            var product = Product.Create(p.Id, info, p.SortOrder, now);
            product.SetAddedAt(p.AddedAt);
            product.SetStatistics(p.Rating, p.Reviews, p.Sales);
            db.Products.Add(product);
        }

        await db.SaveChangesAsync(ct);
        log.LogInformation("Örnek katalog yüklendi: {Categories} kategori, {Products} ürün",
            catalog.Categories.Count, products.Count);
    }

    private static async Task SeedStockAsync(AppDbContext db, TimeProvider clock, ILogger log, CancellationToken ct)
    {
        if (await db.StockItems.AnyAsync(ct))
            return;

        var now = clock.GetUtcNow();
        var productIds = await db.Products.Select(p => p.Id).ToListAsync(ct);
        db.StockItems.AddRange(productIds.Select(id => new StockItem(id, SeedStockQuantity, now)));
        await db.SaveChangesAsync(ct);
        log.LogInformation("Örnek stok yüklendi: {Count} ürün × {Quantity}", productIds.Count, SeedStockQuantity);
    }

    private static async Task<T> ReadSeedAsync<T>(string name, JsonSerializerOptions options, CancellationToken ct)
    {
        var resource = $"Seed.{name}";
        await using var stream = typeof(DatabaseInitializer).Assembly.GetManifestResourceStream(resource)
            ?? throw new InvalidOperationException($"Gömülü örnek veri bulunamadı: {resource}");
        return await JsonSerializer.DeserializeAsync<T>(stream, options, ct)
            ?? throw new InvalidOperationException($"Örnek veri okunamadı: {resource}");
    }
}
