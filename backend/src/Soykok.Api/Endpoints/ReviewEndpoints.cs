using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Soykok.Api.Http;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Application.Reviews;
using Soykok.Infrastructure.Identity;

namespace Soykok.Api.Endpoints;

/// <summary>
/// Ürün yorumları.
///   GET    /api/products/{id}/reviews?page=1          (herkes; giriş yapmışsa kendi yorumu da döner)
///   POST   /api/products/{id}/reviews                 (üye) { rating, title, comment }
///   GET    /api/admin/reviews?durum=bekleyen|onayli   (admin)
///   POST   /api/admin/reviews/{id}/approve            (admin)
///   DELETE /api/admin/reviews/{id}                    (admin)
/// </summary>
public static class ReviewEndpoints
{
    public static RouteGroupBuilder MapReviewEndpoints(this RouteGroupBuilder api)
    {
        var site = api.MapGroup("/products/{productId}/reviews").WithTags("Reviews");
        site.MapGet("/", async (
            string productId, ClaimsPrincipal user,
            IQueryHandler<GetProductReviewsQuery, Result<ProductReviewsResponse>> h, CancellationToken ct,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 10) =>
            (await h.HandleAsync(new GetProductReviewsQuery(productId, page, pageSize, user.ToCurrentUser()?.IdentityId), ct))
                .ToHttp(r => Results.Ok(r)))
            .AllowAnonymous();
        site.MapPost("/", async (
            string productId, WriteReviewRequest body, ClaimsPrincipal user,
            ICommandHandler<WriteReviewCommand, Result<MyReviewDto>> h, CancellationToken ct) =>
            user.ToCurrentUser() is { } me
                ? (await h.HandleAsync(new WriteReviewCommand(productId, body, me), ct)).ToHttp(r => Results.Ok(r))
                : Results.Unauthorized())
            .RequireAuthorization();

        var admin = api.MapGroup("/admin/reviews").WithTags("Admin").RequireAuthorization(AuthConstants.AdminPolicy);
        admin.MapGet("/", async (
            IQueryHandler<ListReviewsQuery, AdminReviewPage> h, CancellationToken ct,
            [FromQuery] string? durum = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
            Results.Ok(await h.HandleAsync(new ListReviewsQuery(durum, page, pageSize), ct)));
        admin.MapPost("/{id:guid}/approve", async (
            Guid id, ICommandHandler<ApproveReviewCommand, Result> h, CancellationToken ct) =>
            (await h.HandleAsync(new ApproveReviewCommand(id), ct)).ToHttp(() => Results.NoContent()));
        admin.MapDelete("/{id:guid}", async (
            Guid id, ICommandHandler<DeleteReviewCommand, Result> h, CancellationToken ct) =>
            (await h.HandleAsync(new DeleteReviewCommand(id), ct)).ToHttp(() => Results.NoContent()));

        return api;
    }
}
