using Microsoft.EntityFrameworkCore;
using Soykok.Application.Common.Abstractions;
using Soykok.Domain.Catalog;

namespace Soykok.Infrastructure.Persistence.Repositories;

internal sealed class ProductRepository(AppDbContext db) : IProductRepository
{
    public Task<Product?> GetByIdAsync(string id, CancellationToken ct) =>
        db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<IReadOnlyList<Product>> GetByIdsAsync(IReadOnlyCollection<string> ids, CancellationToken ct) =>
        await db.Products.Where(p => ids.Contains(p.Id)).ToListAsync(ct);

    public Task<bool> ExistsAsync(string id, CancellationToken ct) =>
        db.Products.AnyAsync(p => p.Id == id, ct);

    public async Task<int> GetMaxSortOrderAsync(CancellationToken ct) =>
        await db.Products.MaxAsync(p => (int?)p.SortOrder, ct) ?? 0;

    public void Add(Product product) => db.Products.Add(product);

    public void Remove(Product product) => db.Products.Remove(product);
}

internal sealed class CategoryRepository(AppDbContext db) : ICategoryRepository
{
    public Task<bool> ExistsAsync(string slug, CancellationToken ct) =>
        db.Categories.AnyAsync(c => c.Slug == slug, ct);

    public Task<List<Category>> ListForUpdateAsync(CancellationToken ct) =>
        db.Categories.OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToListAsync(ct);

    public Task<List<CategoryGroup>> ListGroupsForUpdateAsync(CancellationToken ct) =>
        db.CategoryGroups.OrderBy(g => g.SortOrder).ThenBy(g => g.Label).ToListAsync(ct);

    public Task<Dictionary<string, int>> CountProductsAsync(CancellationToken ct) =>
        db.Products.GroupBy(p => p.CategorySlug).Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, ct);

    public void Add(Category category) => db.Categories.Add(category);
    public void Remove(Category category) => db.Categories.Remove(category);
    public void Add(CategoryGroup group) => db.CategoryGroups.Add(group);
    public void Remove(CategoryGroup group) => db.CategoryGroups.Remove(group);
}

internal sealed class CatalogReadRepository(AppDbContext db) : ICatalogReadRepository
{
    public async Task<IReadOnlyList<Product>> ListProductsAsync(CancellationToken ct) =>
        await db.Products.AsNoTracking().OrderBy(p => p.SortOrder).ToListAsync(ct);

    public async Task<IReadOnlyList<Category>> ListCategoriesAsync(CancellationToken ct) =>
        await db.Categories.AsNoTracking().OrderBy(c => c.SortOrder).ToListAsync(ct);

    public async Task<IReadOnlyList<CategoryGroup>> ListCategoryGroupsAsync(CancellationToken ct) =>
        await db.CategoryGroups.AsNoTracking().OrderBy(g => g.SortOrder).ToListAsync(ct);

    public Task<Product?> FindProductAsync(string id, CancellationToken ct) =>
        db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, ct);
}
