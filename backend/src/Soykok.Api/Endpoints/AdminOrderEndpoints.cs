using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Soykok.Api.Http;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Application.Ordering.Admin;
using Soykok.Infrastructure.Identity;

namespace Soykok.Api.Endpoints;

/// <summary>
/// Sipariş yönetimi (yalnızca admin).
///   GET  /api/admin/orders?durum=awaitingPayment&q=ayşe&page=1&pageSize=20
///   GET  /api/admin/orders/{number}
///   POST /api/admin/orders/{number}/status   { status: "received", note: "Havale geldi" }
/// </summary>
public static class AdminOrderEndpoints
{
    public static RouteGroupBuilder MapAdminOrderEndpoints(this RouteGroupBuilder api)
    {
        var admin = api.MapGroup("/admin/orders")
            .WithTags("Admin")
            .RequireAuthorization(AuthConstants.AdminPolicy);

        admin.MapGet("/", ListOrders);
        admin.MapGet("/{number}", GetOrder);
        admin.MapPost("/{number}/status", ChangeStatus);
        return api;
    }

    private static async Task<IResult> ListOrders(
        IQueryHandler<ListOrdersQuery, AdminOrderPage> handler,
        CancellationToken ct,
        [FromQuery(Name = "durum")] string? durum = null,
        [FromQuery] string? q = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20) =>
        Results.Ok(await handler.HandleAsync(new ListOrdersQuery(durum, q, page, pageSize), ct));

    private static async Task<IResult> GetOrder(
        string number, IQueryHandler<GetAdminOrderQuery, Result<AdminOrderDetail>> handler, CancellationToken ct) =>
        (await handler.HandleAsync(new GetAdminOrderQuery(number), ct)).ToHttp(order => Results.Ok(order));

    private static async Task<IResult> ChangeStatus(
        string number,
        ChangeOrderStatusRequest request,
        ClaimsPrincipal user,
        ICommandHandler<ChangeOrderStatusCommand, Result<AdminOrderDetail>> handler,
        CancellationToken ct)
    {
        var by = user.FindFirst("email")?.Value ?? user.Identity?.Name ?? "admin";
        var result = await handler.HandleAsync(new ChangeOrderStatusCommand(number, request.Status, request.Note, by), ct);
        return result.ToHttp(order => Results.Ok(order));
    }
}
