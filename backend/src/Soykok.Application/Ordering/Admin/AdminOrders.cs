using Microsoft.Extensions.Logging;
using Soykok.Application.Catalog;
using Soykok.Application.Common.Abstractions;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Application.Ordering.Contracts;
using Soykok.Domain.Common;
using Soykok.Domain.Ordering;

namespace Soykok.Application.Ordering.Admin;

/* ======================= Sözleşmeler ======================= */

/// <summary>Admin sipariş listesindeki satır</summary>
public sealed record AdminOrderRow(
    string Number, string Status, DateTimeOffset PlacedAt,
    string BuyerName, string BuyerEmail, string BuyerPhone, bool IsMember,
    string DeliveryMethod, string PaymentMethod, string? City, int ItemCount, decimal Total)
{
    public static AdminOrderRow From(Order o) => new(
        o.Number, OrderingNames.Status(o.Status), o.PlacedAt,
        $"{o.Buyer.FirstName} {o.Buyer.LastName}", o.Buyer.Email, o.Buyer.Phone, o.CustomerId is not null,
        OrderingNames.Of(o.DeliveryMethod), OrderingNames.Of(o.PaymentMethod), o.ShippingAddress?.City,
        o.Items.Count, o.Total);
}

public sealed record AdminOrderPage(int Total, int Page, int PageSize, IReadOnlyList<AdminOrderRow> Items);

public sealed record InvoiceDto(string Type, string? CompanyName, string? TaxOffice, string? TaxNumber);

/// <summary>Admin sipariş detayı: müşteri detayı + fatura + geçilebilecek durumlar</summary>
public sealed record AdminOrderDetail(
    OrderDetail Order, InvoiceDto Invoice, bool IsMember, bool MarketingConsent, IReadOnlyList<string> NextStatuses)
{
    public static AdminOrderDetail From(Order o) => new(
        OrderDetail.From(o, includePersonal: true),
        new InvoiceDto(
            o.Invoice.Type == InvoiceType.Corporate ? "corporate" : "individual",
            o.Invoice.CompanyName, o.Invoice.TaxOffice, o.Invoice.TaxNumber),
        o.CustomerId is not null,
        o.MarketingConsent,
        o.NextStatuses.Select(OrderingNames.Status).ToList());
}

public sealed record ChangeOrderStatusRequest(string? Status, string? Note);

/// <summary>RabbitMQ: order.status_changed (ör. müşteriye e-posta/SMS gönderecek servis dinler)</summary>
public sealed record OrderStatusChangedEvent(
    Guid OrderId, string Number, string Email, string From, string To, string? Note, DateTimeOffset ChangedAt);

public static class AdminOrderEvents
{
    public const string StatusChanged = "order.status_changed";
}

/* ======================= Liste ======================= */

public sealed record ListOrdersQuery(string? Status, string? Search, int Page = 1, int PageSize = 20);

public sealed class ListOrdersHandler(IOrderRepository orders) : IQueryHandler<ListOrdersQuery, AdminOrderPage>
{
    public const int MaxPageSize = 100;

    public async Task<AdminOrderPage> HandleAsync(ListOrdersQuery query, CancellationToken ct)
    {
        OrderStatus? status = Enum.TryParse<OrderStatus>(query.Status, ignoreCase: true, out var s) ? s : null;
        var page = Math.Max(query.Page, 1);
        var size = Math.Clamp(query.PageSize, 1, MaxPageSize);

        var (total, items) = await orders.SearchAsync(status, query.Search?.Trim(), page, size, ct);
        return new AdminOrderPage(total, page, size, items.Select(AdminOrderRow.From).ToList());
    }
}

/* ======================= Detay ======================= */

public sealed record GetAdminOrderQuery(string Number);

public sealed class GetAdminOrderHandler(IOrderRepository orders) : IQueryHandler<GetAdminOrderQuery, Result<AdminOrderDetail>>
{
    public async Task<Result<AdminOrderDetail>> HandleAsync(GetAdminOrderQuery query, CancellationToken ct)
    {
        var order = await orders.FindByNumberAsync(query.Number.Trim().ToUpperInvariant(), ct);
        if (order is null) return OrderingErrors.OrderNotFound();
        return AdminOrderDetail.From(order);
    }
}

/* ======================= Durum değiştirme ======================= */

public sealed record ChangeOrderStatusCommand(string Number, string? Status, string? Note, string ChangedBy);

/// <summary>
/// Sipariş durumunu ilerletir (ör. havale geldi → received, kargoya verildi → shipped).
/// İptalde stok geri eklenir ve ürünlerin satış adedi geri alınır. Geçerli geçişler
/// Domain'deki Order kuralındadır (teslim edilmiş sipariş iptal edilemez vb.).
/// </summary>
public sealed class ChangeOrderStatusHandler(
    IOrderRepository orders,
    IProductRepository products,
    IStockReservation stock,
    IUnitOfWork unitOfWork,
    CatalogSnapshotProvider catalog,
    IEventPublisher events,
    TimeProvider clock,
    ILogger<ChangeOrderStatusHandler> log) : ICommandHandler<ChangeOrderStatusCommand, Result<AdminOrderDetail>>
{
    public async Task<Result<AdminOrderDetail>> HandleAsync(ChangeOrderStatusCommand command, CancellationToken ct)
    {
        if (!Enum.TryParse<OrderStatus>(command.Status, ignoreCase: true, out var next) || !Enum.IsDefined(next))
            return Error.Validation(new Dictionary<string, string[]> { ["status"] = ["Geçerli bir durum seçin."] });
        if (command.Note is { Length: > 500 })
            return Error.Validation(new Dictionary<string, string[]> { ["note"] = ["Not en fazla 500 karakter olabilir."] });

        var order = await orders.GetForUpdateAsync(command.Number.Trim().ToUpperInvariant(), ct);
        if (order is null) return OrderingErrors.OrderNotFound();

        var previous = order.Status;
        if (!order.NextStatuses.Contains(next))
            return Error.Conflict("ordering.invalid_transition",
                $"Sipariş \"{Label(previous)}\" durumundan \"{Label(next)}\" durumuna geçirilemez.");

        var now = clock.GetUtcNow();
        await unitOfWork.ExecuteInTransactionAsync(async tct =>
        {
            if (next == OrderStatus.Cancelled)
            {
                var quantities = order.Items
                    .GroupBy(i => i.ProductId)
                    .ToDictionary(g => g.Key, g => g.Sum(i => i.Quantity));
                await stock.ReleaseAsync(quantities, now, tct);

                foreach (var p in await products.GetByIdsAsync(quantities.Keys.ToList(), tct))
                    p.SetStatistics(p.Rating, p.Reviews, Math.Max(0, p.Sales - quantities[p.Id]));
            }

            order.ChangeStatus(next, command.Note, now);
            await unitOfWork.SaveChangesAsync(tct);
            return (true, true);
        }, ct);

        log.LogInformation("Sipariş {Number}: {From} → {To} ({By})", order.Number, previous, next, command.ChangedBy);

        if (next == OrderStatus.Cancelled) await catalog.InvalidateAsync(ct);
        await events.PublishAsync(AdminOrderEvents.StatusChanged, new OrderStatusChangedEvent(
            order.Id, order.Number, order.Buyer.Email,
            OrderingNames.Status(previous), OrderingNames.Status(next), command.Note, now), ct);

        return AdminOrderDetail.From(order);
    }

    private static string Label(OrderStatus s) => s switch
    {
        OrderStatus.AwaitingPayment => "Ödeme Bekleniyor",
        OrderStatus.Received => "Sipariş Alındı",
        OrderStatus.Preparing => "Hazırlanıyor",
        OrderStatus.Shipped => "Kargoya Verildi",
        OrderStatus.Delivered => "Teslim Edildi",
        OrderStatus.Cancelled => "İptal Edildi",
        _ => s.ToString(),
    };
}
