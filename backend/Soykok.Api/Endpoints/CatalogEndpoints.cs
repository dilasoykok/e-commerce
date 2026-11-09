using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Soykok.Api.Contracts;
using Soykok.Api.Data;
using Soykok.Api.Domain;
using Soykok.Api.Infrastructure;

namespace Soykok.Api.Endpoints;

public static class CatalogEndpoints
{
    private static readonly CultureInfo Tr = CultureInfo.GetCultureInfo("tr-TR");
    private static readonly string[] BadgeTypes = ["sale", "new", "info"];

    public static RouteGroupBuilder MapCatalogEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/categories", GetCategories).WithTags("Catalog");

        var products = api.MapGroup("/products").WithTags("Catalog");
        products.MapGet("/", GetProducts);
        products.MapGet("/{id}", GetProduct);
        products.MapPost("/", CreateProduct).RequireAuthorization(KeycloakAuth.AdminPolicy);
        products.MapPut("/{id}", UpdateProduct).RequireAuthorization(KeycloakAuth.AdminPolicy);
        products.MapDelete("/{id}", DeleteProduct).RequireAuthorization(KeycloakAuth.AdminPolicy);

        return api;
    }

    // ------------------------------------------------------------------
    // GET /api/categories
    // ------------------------------------------------------------------
    private static async Task<IResult> GetCategories(CatalogCache catalog, CancellationToken ct)
    {
        var snapshot = await catalog.GetAsync(ct);
        return Results.Ok(new CatalogCategories(snapshot.Categories, snapshot.Groups));
    }

    // ------------------------------------------------------------------
    // GET /api/products?q=&kategori=parke,lvt&marka=Egger&min=&max=&indirim=1&sirala=fiyat-artan&page=1&pageSize=24
    // Parametreler urunler.html'in adres çubuğundakilerle aynı.
    // ------------------------------------------------------------------
    private static async Task<IResult> GetProducts(
        CatalogCache catalog,
        CancellationToken ct,
        [FromQuery] string? q = null,
        [FromQuery(Name = "kategori")] string? kategori = null,
        [FromQuery(Name = "marka")] string? marka = null,
        [FromQuery] decimal? min = null,
        [FromQuery] decimal? max = null,
        [FromQuery(Name = "indirim")] string? indirim = null,
        [FromQuery(Name = "sirala")] string? sirala = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24)
    {
        var snapshot = await catalog.GetAsync(ct);
        var categoryNames = snapshot.Categories.ToDictionary(c => c.Slug, c => c.Name);
        var groups = snapshot.Groups.ToDictionary(g => g.Slug, g => g.Categories);

        // ?kategori=parke → laminat, masif, vinil ...
        var categories = Split(kategori)
            .SelectMany(c => groups.TryGetValue(c, out var members) ? members : new[] { c })
            .Where(categoryNames.ContainsKey)
            .ToHashSet();
        var brands = Split(marka).ToHashSet();
        var search = Normalize(q);

        IEnumerable<ProductListItem> result = snapshot.Products.Where(p =>
        {
            if (search.Length > 0)
            {
                var haystack = Normalize($"{p.Name} {p.Brand} {categoryNames.GetValueOrDefault(p.Category)}");
                if (!haystack.Contains(search, StringComparison.Ordinal)) return false;
            }
            if (categories.Count > 0 && !categories.Contains(p.Category)) return false;
            if (brands.Count > 0 && !brands.Contains(p.Brand)) return false;
            if (min is not null && p.Price < min) return false;
            if (max is not null && p.Price > max) return false;
            if (indirim == "1" && p.OldPrice is null) return false;
            return true;
        });

        result = sirala switch
        {
            "populer" => result.OrderByDescending(p => p.Sales),
            "yeni" => result.OrderByDescending(p => p.AddedAt),
            "fiyat-artan" => result.OrderBy(p => p.Price),
            "fiyat-azalan" => result.OrderByDescending(p => p.Price),
            "puan" => result.OrderByDescending(p => p.Rating).ThenByDescending(p => p.Reviews),
            _ => result.OrderBy(p => p.SortOrder), // onerilen
        };

        var list = result.ToList();
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var items = list.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return Results.Ok(new ProductPage(list.Count, page, pageSize, items));
    }

    // ------------------------------------------------------------------
    // GET /api/products/{id}
    // ------------------------------------------------------------------
    private static async Task<IResult> GetProduct(string id, AppDbContext db, CancellationToken ct)
    {
        var product = await db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, ct);
        return product is null ? Results.NotFound() : Results.Ok(ProductDetail.From(product));
    }

    // ------------------------------------------------------------------
    // POST /api/products   (admin)
    // ------------------------------------------------------------------
    private static async Task<IResult> CreateProduct(
        ProductUpsertRequest req, AppDbContext db, CatalogCache catalog, IEventPublisher events, CancellationToken ct)
    {
        var errors = await ValidateAsync(req, db, ct);
        if (errors.Count > 0) return Results.ValidationProblem(errors);

        var id = string.IsNullOrWhiteSpace(req.Id) ? "p-" + Guid.NewGuid().ToString("N")[..8] : req.Id.Trim();
        if (await db.Products.AnyAsync(p => p.Id == id, ct))
            return Results.Conflict(new { message = $"'{id}' kimlikli ürün zaten var." });

        var lastOrder = await db.Products.MaxAsync(p => (int?)p.SortOrder, ct) ?? 0;
        var product = new Product
        {
            Id = id,
            Name = req.Name.Trim(),
            Brand = req.Brand.Trim(),
            CategorySlug = req.Category,
            Image = req.Image.Trim(),
            AddedAt = DateOnly.FromDateTime(DateTime.UtcNow),
            SortOrder = lastOrder + 1,
        };
        Apply(product, req);

        db.Products.Add(product);
        await db.SaveChangesAsync(ct);
        await catalog.InvalidateAsync(ct);
        await events.PublishAsync("product.created",
            new ProductChangedEvent(product.Id, product.Name, product.Price, "created", DateTimeOffset.UtcNow), ct);

        return Results.Created($"/api/products/{product.Id}", ProductDetail.From(product));
    }

    // ------------------------------------------------------------------
    // PUT /api/products/{id}   (admin)
    // ------------------------------------------------------------------
    private static async Task<IResult> UpdateProduct(
        string id, ProductUpsertRequest req, AppDbContext db, CatalogCache catalog, IEventPublisher events,
        CancellationToken ct)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product is null) return Results.NotFound();

        var errors = await ValidateAsync(req, db, ct);
        if (errors.Count > 0) return Results.ValidationProblem(errors);

        product.Name = req.Name.Trim();
        product.Brand = req.Brand.Trim();
        product.CategorySlug = req.Category;
        product.Image = req.Image.Trim();
        Apply(product, req);
        product.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
        await catalog.InvalidateAsync(ct);
        await events.PublishAsync("product.updated",
            new ProductChangedEvent(product.Id, product.Name, product.Price, "updated", DateTimeOffset.UtcNow), ct);

        return Results.Ok(ProductDetail.From(product));
    }

    // ------------------------------------------------------------------
    // DELETE /api/products/{id}   (admin)
    // ------------------------------------------------------------------
    private static async Task<IResult> DeleteProduct(
        string id, AppDbContext db, CatalogCache catalog, IEventPublisher events, CancellationToken ct)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product is null) return Results.NotFound();

        db.Products.Remove(product);
        await db.SaveChangesAsync(ct);
        await catalog.InvalidateAsync(ct);
        await events.PublishAsync("product.deleted",
            new ProductChangedEvent(product.Id, product.Name, product.Price, "deleted", DateTimeOffset.UtcNow), ct);

        return Results.NoContent();
    }

    // ------------------------------------------------------------------
    // Yardımcılar
    // ------------------------------------------------------------------
    private static void Apply(Product p, ProductUpsertRequest req)
    {
        p.Unit = string.IsNullOrWhiteSpace(req.Unit) ? null : req.Unit.Trim();
        p.Price = req.Price;
        p.OldPrice = req.OldPrice;
        p.Badge = string.IsNullOrWhiteSpace(req.Badge) ? null : req.Badge.Trim();
        p.BadgeType = string.IsNullOrWhiteSpace(req.BadgeType) ? null : req.BadgeType;
        p.BoxM2 = req.BoxM2;
        p.Images = req.Images ?? Array.Empty<string>();
        p.Description = req.Description;
        p.Features = req.Features ?? Array.Empty<string>();
        p.Specs = (req.Specs ?? new Dictionary<string, string>()).Select(kv => new ProductSpec(kv.Key, kv.Value)).ToList();
    }

    private static async Task<Dictionary<string, string[]>> ValidateAsync(
        ProductUpsertRequest req, AppDbContext db, CancellationToken ct)
    {
        var errors = new Dictionary<string, string[]>();
        void Add(string field, string message) => errors[field] = [message];

        if (string.IsNullOrWhiteSpace(req.Name)) Add("name", "Ürün adı zorunlu.");
        if (string.IsNullOrWhiteSpace(req.Brand)) Add("brand", "Marka zorunlu.");
        if (string.IsNullOrWhiteSpace(req.Image)) Add("image", "Görsel zorunlu.");
        if (req.Price <= 0) Add("price", "Fiyat sıfırdan büyük olmalı.");
        if (req.OldPrice is not null && req.OldPrice <= req.Price) Add("oldPrice", "Eski fiyat, fiyattan büyük olmalı.");
        if (req.BadgeType is { Length: > 0 } bt && !BadgeTypes.Contains(bt))
            Add("badgeType", "badgeType: sale, new veya info olmalı.");
        if (string.IsNullOrWhiteSpace(req.Category) || !await db.Categories.AnyAsync(c => c.Slug == req.Category, ct))
            Add("category", "Geçerli bir kategori seçin (GET /api/categories).");

        return errors;
    }

    private static IEnumerable<string> Split(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? Array.Empty<string>()
            : value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    /// <summary>Türkçe küçük harfe çevirir ("İ/ı" aramada sorun çıkarmaz) — frontend'deki normalize ile aynı.</summary>
    private static string Normalize(string? text) => (text ?? string.Empty).ToLower(Tr).Trim();
}
