using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Soykok.Infrastructure.Messaging;
using Soykok.Infrastructure.Persistence;

namespace Soykok.Infrastructure.Health;

public static class HealthCheckNames
{
    public const string Postgres = "postgres";
    public const string Redis = "redis";
    public const string RabbitMq = "rabbitmq";
}

internal sealed class PostgresHealthCheck(AppDbContext db) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct = default) =>
        await db.Database.CanConnectAsync(ct)
            ? HealthCheckResult.Healthy()
            : HealthCheckResult.Unhealthy("PostgreSQL'e bağlanılamadı");
}

internal sealed class RedisHealthCheck(IDistributedCache cache) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct = default)
    {
        await cache.SetStringAsync("health:ping", "ok",
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30) }, ct);
        return HealthCheckResult.Healthy();
    }
}

internal sealed class RabbitMqHealthCheck(RabbitMqPublisher publisher) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct = default) =>
        await publisher.PingAsync(ct)
            ? HealthCheckResult.Healthy()
            : HealthCheckResult.Unhealthy("RabbitMQ'ya bağlanılamadı");
}
