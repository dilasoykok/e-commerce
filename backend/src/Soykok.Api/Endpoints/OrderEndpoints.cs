using System.Security.Claims;
using Soykok.Api.Http;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Application.Ordering.Commands;
using Soykok.Application.Ordering.Contracts;
using Soykok.Application.Ordering.Queries;

namespace Soykok.Api.Endpoints;

/// <summary>
/// Siparişler.
///   POST /api/orders                 → sipariş ver (misafir ya da üye)
///   POST /api/orders/track           → misafir takibi: { number, email }
///   GET  /api/me/orders              → üyenin siparişleri
///   GET  /api/me/orders/{number}     → üyenin tek siparişi
/// </summary>
public static class OrderEndpoints
{
    public static RouteGroupBuilder MapOrderEndpoints(this RouteGroupBuilder api)
    {
        var orders = api.MapGroup("/orders").WithTags("Orders");
        orders.MapPost("/", PlaceOrder).AllowAnonymous();
        orders.MapPost("/track", TrackOrder).AllowAnonymous();

        var mine = api.MapGroup("/me/orders").WithTags("Orders").RequireAuthorization();
        mine.MapGet("/", GetMyOrders);
        mine.MapGet("/{number}", GetMyOrder);

        return api;
    }

    // POST /api/orders
    private static async Task<IResult> PlaceOrder(
        PlaceOrderRequest request,
        ClaimsPrincipal user,
        ICommandHandler<PlaceOrderCommand, Result<OrderDetail>> handler,
        CancellationToken ct) =>
        (await handler.HandleAsync(new PlaceOrderCommand(request, CurrentUserFrom(user)), ct))
            .ToHttp(order => Results.Created($"/api/me/orders/{order.Number}", order));

    // POST /api/orders/track
    private static async Task<IResult> TrackOrder(
        TrackOrderRequest request,
        IQueryHandler<TrackOrderQuery, Result<OrderDetail>> handler,
        CancellationToken ct) =>
        (await handler.HandleAsync(new TrackOrderQuery(request.Number, request.Email), ct)).ToHttp(order => Results.Ok(order));

    // GET /api/me/orders
    private static async Task<IResult> GetMyOrders(
        ClaimsPrincipal user,
        IQueryHandler<GetMyOrdersQuery, IReadOnlyList<OrderSummary>> handler,
        CancellationToken ct) =>
        CurrentUserFrom(user) is { } me
            ? Results.Ok(await handler.HandleAsync(new GetMyOrdersQuery(me.IdentityId), ct))
            : Results.Unauthorized();

    // GET /api/me/orders/{number}
    private static async Task<IResult> GetMyOrder(
        string number,
        ClaimsPrincipal user,
        IQueryHandler<GetMyOrderQuery, Result<OrderDetail>> handler,
        CancellationToken ct) =>
        CurrentUserFrom(user) is { } me
            ? (await handler.HandleAsync(new GetMyOrderQuery(me.IdentityId, number), ct)).ToHttp(order => Results.Ok(order))
            : Results.Unauthorized();

    /// <summary>Oturum çerezinden ya da Bearer token'dan kullanıcı ("sub" yoksa null)</summary>
    private static CurrentUser? CurrentUserFrom(ClaimsPrincipal user)
    {
        if (user.Identity?.IsAuthenticated != true) return null;
        var sub = user.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(sub)) return null;
        return new CurrentUser(
            sub,
            user.FindFirst("email")?.Value ?? "",
            user.FindFirst("given_name")?.Value ?? user.FindFirst("name")?.Value ?? "",
            user.FindFirst("family_name")?.Value ?? "");
    }
}
