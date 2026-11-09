using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Soykok.Api.Domain;

namespace Soykok.Api.Data;

/// <summary>
/// Veritabanı boşsa Data/Seed/*.json dosyalarındaki örnek kataloğu yükler.
/// Bu dosyalar frontend'deki src/js/data/products.js'ten üretildi.
/// </summary>
public static class SeedData
{
    private sealed record SeedCategory(string Slug, string Name, int SortOrder);
    private sealed record SeedGroup(string Slug, string Label, string[] Categories, int SortOrder);
    private sealed record SeedCatalog(List<SeedCategory> Categories, List<SeedGroup> Groups);

    private sealed record SeedProduct(
        string Id, string Name, string Brand, string Category, string? Unit, string Image,
        decimal Price, decimal? OldPrice, double Rating, int Reviews, string? Badge, string? BadgeType,
        DateOnly AddedAt, int Sales, int SortOrder,
        decimal? BoxM2, string[]? Images, string? Description, string[]? Features, Dictionary<string, string>? Specs);

    public static async Task InitializeAsync(IServiceProvider services, CancellationToken ct = default)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var log = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("SeedData");

        // Şimdilik şema EnsureCreated ile kuruluyor; şema oturunca EF migrations'a geçilecek.
        await db.Database.EnsureCreatedAsync(ct);

        if (await db.Categories.AnyAsync(ct))
            return;

        var dir = Path.Combine(AppContext.BaseDirectory, "Data", "Seed");
        var json = JsonSerializerOptions.Web;

        var catalog = JsonSerializer.Deserialize<SeedCatalog>(
            await File.ReadAllTextAsync(Path.Combine(dir, "categories.json"), ct), json)!;
        var products = JsonSerializer.Deserialize<List<SeedProduct>>(
            await File.ReadAllTextAsync(Path.Combine(dir, "products.json"), ct), json)!;

        db.Categories.AddRange(catalog.Categories.Select(c => new Category
        {
            Slug = c.Slug, Name = c.Name, SortOrder = c.SortOrder,
        }));

        db.CategoryGroups.AddRange(catalog.Groups.Select(g => new CategoryGroup
        {
            Slug = g.Slug, Label = g.Label, CategorySlugs = g.Categories, SortOrder = g.SortOrder,
        }));

        db.Products.AddRange(products.Select(p => new Product
        {
            Id = p.Id,
            Name = p.Name,
            Brand = p.Brand,
            CategorySlug = p.Category,
            Unit = p.Unit,
            Image = p.Image,
            Price = p.Price,
            OldPrice = p.OldPrice,
            Rating = p.Rating,
            Reviews = p.Reviews,
            Badge = p.Badge,
            BadgeType = p.BadgeType,
            AddedAt = p.AddedAt,
            Sales = p.Sales,
            SortOrder = p.SortOrder,
            BoxM2 = p.BoxM2,
            Images = p.Images ?? Array.Empty<string>(),
            Description = p.Description,
            Features = p.Features ?? Array.Empty<string>(),
            Specs = (p.Specs ?? new Dictionary<string, string>()).Select(kv => new ProductSpec(kv.Key, kv.Value)).ToList(),
        }));

        await db.SaveChangesAsync(ct);
        log.LogInformation("Örnek katalog yüklendi: {Categories} kategori, {Products} ürün",
            catalog.Categories.Count, products.Count);
    }
}
