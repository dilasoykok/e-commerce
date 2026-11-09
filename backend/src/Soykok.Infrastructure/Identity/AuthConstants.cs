using Microsoft.AspNetCore.Authentication.OpenIdConnect;

namespace Soykok.Infrastructure.Identity;

public static class AuthConstants
{
    /// <summary>Keycloak realm rollerinin çevrildiği claim türü.</summary>
    public const string RoleClaim = "role";

    /// <summary>Yalnızca "admin" rolüne açık uç noktalar.</summary>
    public const string AdminPolicy = "Admin";

    public const string OidcScheme = OpenIdConnectDefaults.AuthenticationScheme;

    /// <summary>AuthenticationProperties.Items anahtarı: "create" → Keycloak'ta doğrudan kayıt formu.</summary>
    public const string PromptItem = "prompt";

    internal const string BearerOrCookieScheme = "BearerOrCookie";
}
