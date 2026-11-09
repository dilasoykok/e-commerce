using Soykok.Application.Catalog.Contracts;
using Soykok.Application.Common.Abstractions;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;

namespace Soykok.Application.Catalog.Commands;

public sealed record DeleteProductCommand(string Id);

public sealed class DeleteProductHandler(
    IProductRepository products,
    IUnitOfWork unitOfWork,
    CatalogSnapshotProvider catalog,
    IEventPublisher events,
    TimeProvider clock) : ICommandHandler<DeleteProductCommand, Result>
{
    public async Task<Result> HandleAsync(DeleteProductCommand command, CancellationToken ct)
    {
        var product = await products.GetByIdAsync(command.Id, ct);
        if (product is null) return CatalogErrors.ProductNotFound(command.Id);

        products.Remove(product);
        await unitOfWork.SaveChangesAsync(ct);
        await catalog.InvalidateAsync(ct);
        await events.PublishAsync(CatalogEvents.ProductDeleted,
            new ProductChangedEvent(product.Id, product.Name, product.Price, "deleted", clock.GetUtcNow()), ct);

        return Result.Success();
    }
}
