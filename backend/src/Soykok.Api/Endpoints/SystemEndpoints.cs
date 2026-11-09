using System.Security.Claims;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Soykok.Api.Auth;
using Soykok.Infrastructure.Health;

namespace Soykok.Api.Endpoints;

public static class SystemEndpoints
{
    public static RouteGroupBuilder MapSystemEndpoints(this RouteGroupBuilder api)
    {
        // Servislerin durumu: PostgreSQL, Redis, RabbitMQ
        api.MapGet("/health", async (HealthCheckService health, CancellationToken ct) =>
        {
            var report = await health.CheckHealthAsync(ct);
            bool Healthy(string name) =>
                report.Entries.TryGetValue(name, out var entry) && entry.Status == HealthStatus.Healthy;

            var ok = report.Status == HealthStatus.Healthy;
            var body = new
            {
                status = ok ? "ok" : "degraded",
                postgres = Healthy(HealthCheckNames.Postgres),
                redis = Healthy(HealthCheckNames.Redis),
                rabbitmq = Healthy(HealthCheckNames.RabbitMq),
            };
            return ok ? Results.Ok(body) : Results.Json(body, statusCode: StatusCodes.Status503ServiceUnavailable);
        }).WithTags("System");

        // Giriş yapmış kullanıcı (oturum çerezi ya da Bearer token)
        api.MapGet("/me", (ClaimsPrincipal user) => Results.Ok(UserInfo.From(user)))
            .RequireAuthorization().WithTags("System");

        return api;
    }
}
