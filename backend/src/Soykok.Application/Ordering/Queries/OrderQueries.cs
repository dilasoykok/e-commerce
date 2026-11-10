using Soykok.Application.Common.Abstractions;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Application.Ordering.Contracts;

namespace Soykok.Application.Ordering.Queries;

/* ---------- Üyenin siparişleri: GET /api/me/orders ---------- */

public sealed record GetMyOrdersQuery(string IdentityId);

public sealed class GetMyOrdersHandler(ICustomerRepository customers, IOrderRepository orders)
    : IQueryHandler<GetMyOrdersQuery, IReadOnlyList<OrderSummary>>
{
    public const int MaxOrders = 100;

    public async Task<IReadOnlyList<OrderSummary>> HandleAsync(GetMyOrdersQuery query, CancellationToken ct)
    {
        var customer = await customers.FindByIdentityIdAsync(query.IdentityId, ct);
        if (customer is null) return []; // henüz hiç sipariş vermemiş

        var list = await orders.ListByCustomerAsync(customer.Id, MaxOrders, ct);
        return list.Select(OrderSummary.From).ToList();
    }
}

/* ---------- Üyenin tek siparişi: GET /api/me/orders/{number} ---------- */

public sealed record GetMyOrderQuery(string IdentityId, string Number);

public sealed class GetMyOrderHandler(ICustomerRepository customers, IOrderRepository orders)
    : IQueryHandler<GetMyOrderQuery, Result<OrderDetail>>
{
    public async Task<Result<OrderDetail>> HandleAsync(GetMyOrderQuery query, CancellationToken ct)
    {
        var customer = await customers.FindByIdentityIdAsync(query.IdentityId, ct);
        var order = await orders.FindByNumberAsync(Normalize(query.Number), ct);

        // Başkasının siparişi de "bulunamadı" döner (var olduğu bilgisi sızmasın)
        if (customer is null || order is null || order.CustomerId != customer.Id)
            return OrderingErrors.OrderNotFound();

        return OrderDetail.From(order, includePersonal: true);
    }

    internal static string Normalize(string? number) => (number ?? "").Trim().ToUpperInvariant();
}

/* ---------- Misafir sipariş takibi: POST /api/orders/track ---------- */

public sealed record TrackOrderQuery(string? Number, string? Email);

/// <summary>
/// Sipariş numarası + siparişte kullanılan e-posta birlikte doğruysa sipariş döner.
/// Yalnızca numara yetmez (başkasının siparişini görmeyi engeller). Kişisel bilgiler maskelenir.
/// </summary>
public sealed class TrackOrderHandler(IOrderRepository orders) : IQueryHandler<TrackOrderQuery, Result<OrderDetail>>
{
    public async Task<Result<OrderDetail>> HandleAsync(TrackOrderQuery query, CancellationToken ct)
    {
        var number = GetMyOrderHandler.Normalize(query.Number);
        var email = (query.Email ?? "").Trim().ToLowerInvariant();
        if (number.Length == 0 || email.Length == 0) return OrderingErrors.OrderNotFound();

        var order = await orders.FindByNumberAsync(number, ct);
        if (order is null || order.Buyer.Email != email) return OrderingErrors.OrderNotFound();

        return OrderDetail.From(order, includePersonal: false);
    }
}
