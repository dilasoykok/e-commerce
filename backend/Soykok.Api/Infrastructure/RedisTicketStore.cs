using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Caching.Distributed;

namespace Soykok.Api.Infrastructure;

/// <summary>
/// Oturum bilgisini (kullanıcı, roller, token'lar) Redis'te saklar; tarayıcıdaki çerez yalnızca
/// rastgele bir anahtar taşır. Çerez küçük kalır ve token'lar tarayıcıya hiç gitmez.
/// </summary>
public sealed class RedisTicketStore(IDistributedCache cache) : ITicketStore
{
    private const string Prefix = "auth-session:";
    private static readonly TimeSpan DefaultLifetime = TimeSpan.FromHours(8);

    public async Task<string> StoreAsync(AuthenticationTicket ticket)
    {
        var key = Guid.NewGuid().ToString("N");
        await RenewAsync(key, ticket);
        return key;
    }

    public Task RenewAsync(string key, AuthenticationTicket ticket)
    {
        var options = new DistributedCacheEntryOptions();
        if (ticket.Properties.ExpiresUtc is { } expires)
            options.AbsoluteExpiration = expires;
        else
            options.SlidingExpiration = DefaultLifetime;

        return cache.SetAsync(Prefix + key, TicketSerializer.Default.Serialize(ticket), options);
    }

    public async Task<AuthenticationTicket?> RetrieveAsync(string key)
    {
        var bytes = await cache.GetAsync(Prefix + key);
        return bytes is null ? null : TicketSerializer.Default.Deserialize(bytes);
    }

    public Task RemoveAsync(string key) => cache.RemoveAsync(Prefix + key);
}
