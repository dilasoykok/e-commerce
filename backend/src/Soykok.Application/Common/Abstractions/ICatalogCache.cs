using Soykok.Application.Catalog.Contracts;

namespace Soykok.Application.Common.Abstractions;

/// <summary>
/// Katalog önbelleği (altyapıda Redis). Hatalar içeride loglanır;
/// önbelleğe ulaşılamazsa GetAsync null döner ve veritabanına gidilir.
/// </summary>
public interface ICatalogCache
{
    Task<CatalogSnapshot?> GetAsync(CancellationToken ct);
    Task SetAsync(CatalogSnapshot snapshot, CancellationToken ct);
    Task InvalidateAsync(CancellationToken ct);
}
