using Soykok.Application.Catalog.Contracts;
using Soykok.Application.Common.Abstractions;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Domain.Catalog;

namespace Soykok.Application.Catalog.Commands;

/// <param name="Id">Boşsa otomatik üretilir (p-xxxxxxxx).</param>
public sealed record CreateProductCommand(string? Id, ProductInput Input);

public sealed class CreateProductHandler(
    IProductRepository products,
    ProductInputValidator validator,
    IUnitOfWork unitOfWork,
    CatalogSnapshotProvider catalog,
    IEventPublisher events,
    TimeProvider clock) : ICommandHandler<CreateProductCommand, Result<ProductDetail>>
{
    public async Task<Result<ProductDetail>> HandleAsync(CreateProductCommand command, CancellationToken ct)
    {
        var errors = await validator.ValidateAsync(command.Input, ct);
        if (errors.Count > 0) return Error.Validation(errors);

        var id = string.IsNullOrWhiteSpace(command.Id)
            ? "p-" + Guid.NewGuid().ToString("N")[..8]
            : command.Id.Trim();
        if (await products.ExistsAsync(id, ct))
            return CatalogErrors.ProductAlreadyExists(id);

        var now = clock.GetUtcNow();
        var sortOrder = await products.GetMaxSortOrderAsync(ct) + 1;
        var product = Product.Create(id, command.Input.ToInfo(), sortOrder, now);

        products.Add(product);
        // Yeni ürün: stok girilmediyse takip yok (eski davranış)
        var stock = command.Input.Stock is { Track: true } st ? st.Quantity : (int?)null;
        if (stock is { } qty) products.AddStock(new Soykok.Domain.Inventory.StockItem(id, qty, now));
        await unitOfWork.SaveChangesAsync(ct);
        await catalog.InvalidateAsync(ct);
        await events.PublishAsync(CatalogEvents.ProductCreated,
            new ProductChangedEvent(product.Id, product.Name, product.Price, "created", now), ct);

        return ProductDetail.From(product, stock);
    }
}
