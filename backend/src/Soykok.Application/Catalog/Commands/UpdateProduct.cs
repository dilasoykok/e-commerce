using Soykok.Application.Catalog.Contracts;
using Soykok.Application.Common.Abstractions;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;

namespace Soykok.Application.Catalog.Commands;

public sealed record UpdateProductCommand(string Id, ProductInput Input);

public sealed class UpdateProductHandler(
    IProductRepository products,
    ProductInputValidator validator,
    IUnitOfWork unitOfWork,
    CatalogSnapshotProvider catalog,
    IEventPublisher events,
    TimeProvider clock) : ICommandHandler<UpdateProductCommand, Result<ProductDetail>>
{
    public async Task<Result<ProductDetail>> HandleAsync(UpdateProductCommand command, CancellationToken ct)
    {
        var product = await products.GetByIdAsync(command.Id, ct);
        if (product is null) return CatalogErrors.ProductNotFound(command.Id);

        var errors = await validator.ValidateAsync(command.Input, ct);
        if (errors.Count > 0) return Error.Validation(errors);

        var now = clock.GetUtcNow();
        product.Update(command.Input.ToInfo(), now);

        await unitOfWork.SaveChangesAsync(ct);
        await catalog.InvalidateAsync(ct);
        await events.PublishAsync(CatalogEvents.ProductUpdated,
            new ProductChangedEvent(product.Id, product.Name, product.Price, "updated", now), ct);

        return ProductDetail.From(product);
    }
}
