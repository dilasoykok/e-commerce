using System.Security.Claims;
using Microsoft.Extensions.Caching.Distributed;
using Soykok.Api.Data;
using Soykok.Api.Infrastructure;

namespace Soykok.Api.Endpoints;

public static class SystemEndpoints
{
    public static RouteGroupBuilder MapSystemEndpoints(this RouteGroupBuilder api)
    {
        // Servislerin durumu: PostgreSQL, Redis, RabbitMQ
        api.MapGet("/health", async (AppDbContext db, IDistributedCache cache, IEventPublisher events,
            CancellationToken ct) =>
        {
            var postgres = await Check(() => db.Database.CanConnectAsync(ct));
            var redis = await Check(async () =>
            {
                await cache.SetStringAsync("health:ping", "ok",
                    new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30) },
                    ct);
                return true;
            });
            var rabbitmq = await events.PingAsync(ct);

            var healthy = postgres && redis && rabbitmq;
            var body = new { status = healthy ? "ok" : "degraded", postgres, redis, rabbitmq };
            return healthy ? Results.Ok(body) : Results.Json(body, statusCode: StatusCodes.Status503ServiceUnavailable);
        }).WithTags("System");

        // Giriş yapmış kullanıcının Keycloak bilgileri
        api.MapGet("/me", (ClaimsPrincipal user) => Results.Ok(new
        {
            id = user.FindFirst("sub")?.Value,
            username = user.Identity?.Name,
            email = user.FindFirst("email")?.Value,
            name = user.FindFirst("name")?.Value,
            roles = user.FindAll(KeycloakAuth.RoleClaim).Select(c => c.Value).ToArray(),
        })).RequireAuthorization().WithTags("System");

        return api;
    }

    private static async Task<bool> Check(Func<Task<bool>> probe)
    {
        try
        {
            return await probe();
        }
        catch
        {
            return false;
        }
    }
}
