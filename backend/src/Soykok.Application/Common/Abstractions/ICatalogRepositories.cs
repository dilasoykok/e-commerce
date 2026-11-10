using Soykok.Domain.Catalog;
using Soykok.Domain.Inventory;

namespace Soykok.Application.Common.Abstractions;

/// <summary>Ürün yazma tarafı (takip edilen varlıklar).</summary>
public interface IProductRepository
{
    Task<Product?> GetByIdAsync(string id, CancellationToken ct);
    /// <summary>Birden fazla ürün (takip edilir; sipariş satış adedini günceller).</summary>
    Task<IReadOnlyList<Product>> GetByIdsAsync(IReadOnlyCollection<string> ids, CancellationToken ct);
    Task<bool> ExistsAsync(string id, CancellationToken ct);
    Task<int> GetMaxSortOrderAsync(CancellationToken ct);
    void Add(Product product);
    void Remove(Product product);

    /* Stok (admin) */
    Task<StockItem?> GetStockAsync(string productId, CancellationToken ct);
    void AddStock(StockItem stock);
    void RemoveStock(StockItem stock);
}

public interface ICategoryRepository
{
    Task<bool> ExistsAsync(string slug, CancellationToken ct);

    /* Kategori yönetimi (admin) — takip edilen varlıklar */
    Task<List<Category>> ListForUpdateAsync(CancellationToken ct);
    Task<List<CategoryGroup>> ListGroupsForUpdateAsync(CancellationToken ct);
    /// <summary>Kategori kodu → o kategorideki ürün sayısı</summary>
    Task<Dictionary<string, int>> CountProductsAsync(CancellationToken ct);
    void Add(Category category);
    void Remove(Category category);
    void Add(CategoryGroup group);
    void Remove(CategoryGroup group);
}

/// <summary>Katalog okuma tarafı (takip edilmeyen, sıralı listeler).</summary>
public interface ICatalogReadRepository
{
    Task<IReadOnlyList<Product>> ListProductsAsync(CancellationToken ct);
    Task<IReadOnlyList<Category>> ListCategoriesAsync(CancellationToken ct);
    Task<IReadOnlyList<CategoryGroup>> ListCategoryGroupsAsync(CancellationToken ct);
    Task<Product?> FindProductAsync(string id, CancellationToken ct);
    /// <summary>Ürün kodu → stok adedi (stok kaydı olmayan ürün listede yoktur)</summary>
    Task<Dictionary<string, int>> ListStockAsync(CancellationToken ct);
    Task<int?> FindStockAsync(string productId, CancellationToken ct);
}
