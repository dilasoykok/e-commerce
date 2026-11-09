using Soykok.Application.Catalog.Contracts;
using Soykok.Application.Common.Messaging;

namespace Soykok.Application.Catalog.Queries;

public sealed record GetCategoriesQuery;

public sealed class GetCategoriesHandler(CatalogSnapshotProvider catalog)
    : IQueryHandler<GetCategoriesQuery, CatalogCategories>
{
    public async Task<CatalogCategories> HandleAsync(GetCategoriesQuery query, CancellationToken ct)
    {
        var snapshot = await catalog.GetAsync(ct);
        return new CatalogCategories(snapshot.Categories, snapshot.Groups);
    }
}
