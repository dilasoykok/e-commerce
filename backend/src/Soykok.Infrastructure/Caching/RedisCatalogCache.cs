using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Soykok.Application.Catalog.Contracts;
using Soykok.Application.Common.Abstractions;

namespace Soykok.Infrastructure.Caching;

/// <summary>Katalog görüntüsünü Redis'te tutar. Redis'e ulaşılamazsa uygulama veritabanıyla devam eder.</summary>
internal sealed class RedisCatalogCache(IDistributedCache cache, IConfiguration config, ILogger<RedisCatalogCache> log)
    : ICatalogCache
{
    private const string Key = "catalog:v1";

    public async Task<CatalogSnapshot?> GetAsync(CancellationToken ct)
    {
        try
        {
            var cached = await cache.GetStringAsync(Key, ct);
            return cached is null ? null : JsonSerializer.Deserialize<CatalogSnapshot>(cached, JsonSerializerOptions.Web);
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "Redis'ten katalog okunamadı, veritabanına gidiliyor");
            return null;
        }
    }

    public async Task SetAsync(CatalogSnapshot snapshot, CancellationToken ct)
    {
        try
        {
            var minutes = config.GetValue("Catalog:CacheMinutes", 10);
            await cache.SetStringAsync(Key, JsonSerializer.Serialize(snapshot, JsonSerializerOptions.Web),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(minutes) },
                ct);
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "Katalog Redis'e yazılamadı");
        }
    }

    public async Task InvalidateAsync(CancellationToken ct)
    {
        try
        {
            await cache.RemoveAsync(Key, ct);
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "Katalog önbelleği temizlenemedi");
        }
    }
}
