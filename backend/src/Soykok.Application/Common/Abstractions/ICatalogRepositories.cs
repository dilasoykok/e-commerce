using Soykok.Domain.Catalog;

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
}

public interface ICategoryRepository
{
    Task<bool> ExistsAsync(string slug, CancellationToken ct);
}

/// <summary>Katalog okuma tarafı (takip edilmeyen, sıralı listeler).</summary>
public interface ICatalogReadRepository
{
    Task<IReadOnlyList<Product>> ListProductsAsync(CancellationToken ct);
    Task<IReadOnlyList<Category>> ListCategoriesAsync(CancellationToken ct);
    Task<IReadOnlyList<CategoryGroup>> ListCategoryGroupsAsync(CancellationToken ct);
    Task<Product?> FindProductAsync(string id, CancellationToken ct);
}
