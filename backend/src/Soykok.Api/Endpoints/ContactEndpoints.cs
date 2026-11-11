using System.Net;
using Microsoft.AspNetCore.Mvc;
using Soykok.Api.Http;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Application.Support;
using Soykok.Infrastructure.Identity;

namespace Soykok.Api.Endpoints;

/// <summary>
/// İletişim formu.
///   POST   /api/contact                           (herkes; IP başına 10 dakikada 5 mesaj)
///   GET    /api/admin/messages?okunmamis=1&page=1  (admin)
///   POST   /api/admin/messages/{id}/read          { read: true }  (admin)
///   DELETE /api/admin/messages/{id}                (admin)
/// </summary>
public static class ContactEndpoints
{
    public const string RateLimitPolicy = "contact";

    public sealed record MarkReadRequest(bool Read);

    public static RouteGroupBuilder MapContactEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/contact", Send)
            .WithTags("Support")
            .AllowAnonymous()
            .RequireRateLimiting(RateLimitPolicy);

        var admin = api.MapGroup("/admin/messages").WithTags("Admin").RequireAuthorization(AuthConstants.AdminPolicy);
        admin.MapGet("/", async (
            IQueryHandler<ListContactMessagesQuery, ContactMessagePage> h, CancellationToken ct,
            [FromQuery(Name = "okunmamis")] string? okunmamis = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
            Results.Ok(await h.HandleAsync(new ListContactMessagesQuery(okunmamis == "1", page, pageSize), ct)));
        admin.MapPost("/{id:guid}/read", async (
            Guid id, MarkReadRequest body, ICommandHandler<MarkContactMessageCommand, Result<ContactMessageDto>> h, CancellationToken ct) =>
            (await h.HandleAsync(new MarkContactMessageCommand(id, body.Read), ct)).ToHttp(m => Results.Ok(m)));
        admin.MapDelete("/{id:guid}", async (
            Guid id, ICommandHandler<DeleteContactMessageCommand, Result> h, CancellationToken ct) =>
            (await h.HandleAsync(new DeleteContactMessageCommand(id), ct)).ToHttp(() => Results.NoContent()));

        return api;
    }

    private static async Task<IResult> Send(
        SendContactRequest request, HttpContext http,
        ICommandHandler<SendContactCommand, Result<ContactReceipt>> handler, CancellationToken ct) =>
        (await handler.HandleAsync(new SendContactCommand(request, ClientIp(http)), ct)).ToHttp(r => Results.Ok(r));

    /// <summary>nginx X-Real-IP başlığına müşterinin IP'sini yazar</summary>
    public static string ClientIp(HttpContext http) =>
        IPAddress.TryParse(http.Request.Headers["X-Real-IP"].ToString(), out var ip)
            ? ip.ToString()
            : http.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}
