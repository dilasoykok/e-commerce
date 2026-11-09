namespace Soykok.Infrastructure.Identity;

/// <summary>
/// API konteyneri Keycloak'a tarayıcının adresiyle (http://localhost/...) ulaşamaz.
/// Sunucudan sunucuya giden istekleri (metadata, anahtarlar, token) iç adrese çevirir.
/// </summary>
internal sealed class KeycloakBackchannelHandler(string publicAuthority, string? internalAuthority)
    : DelegatingHandler(new HttpClientHandler())
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrEmpty(internalAuthority) && request.RequestUri is { } uri)
        {
            var url = uri.AbsoluteUri;
            if (url.StartsWith(publicAuthority, StringComparison.OrdinalIgnoreCase))
                request.RequestUri = new Uri(internalAuthority + url[publicAuthority.Length..]);
        }

        return base.SendAsync(request, cancellationToken);
    }
}
