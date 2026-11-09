using Soykok.Application.Catalog.Contracts;
using Soykok.Application.Common.Abstractions;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;

namespace Soykok.Application.Catalog.Queries;

public sealed record GetProductByIdQuery(string Id);

public sealed class GetProductByIdHandler(ICatalogReadRepository repository)
    : IQueryHandler<GetProductByIdQuery, Result<ProductDetail>>
{
    public async Task<Result<ProductDetail>> HandleAsync(GetProductByIdQuery query, CancellationToken ct)
    {
        var product = await repository.FindProductAsync(query.Id, ct);
        if (product is null)
            return CatalogErrors.ProductNotFound(query.Id);

        return ProductDetail.From(product);
    }
}
