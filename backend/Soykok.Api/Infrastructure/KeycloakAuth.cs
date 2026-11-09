using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace Soykok.Api.Infrastructure;

/// <summary>
/// Keycloak kimlik doğrulaması. İki yol desteklenir:
///  - Tarayıcı (site): OpenID Connect + HttpOnly oturum çerezi (BFF). Token'lar tarayıcıya hiç verilmez,
///    oturum Redis'te tutulur. Giriş: /api/auth/login, kayıt: /api/auth/register, çıkış: /api/auth/logout
///  - Araçlar / diğer servisler: "Authorization: Bearer &lt;token&gt;" başlığı (JWT).
/// </summary>
public static class KeycloakAuth
{
    public const string RoleClaim = "role";
    public const string AdminPolicy = "Admin";
    public const string OidcScheme = OpenIdConnectDefaults.AuthenticationScheme;
    public const string PromptItem = "prompt";

    private const string SmartScheme = "BearerOrCookie";

    public static IServiceCollection AddKeycloakAuth(this IServiceCollection services, IConfiguration config)
    {
        var kc = config.GetSection("Keycloak");
        // Tarayıcının gördüğü adres (token'lardaki issuer): http://localhost/auth/realms/soykok
        var authority = kc["Authority"]!.TrimEnd('/');
        // Konteyner içinden erişilen adres: http://keycloak:8080/auth/realms/soykok (boşsa authority kullanılır)
        var internalAuthority = kc["InternalAuthority"]?.TrimEnd('/');

        // Oturum bilgisi çerezde değil Redis'te; çerez yalnızca anahtarı taşır
        services.AddSingleton<ITicketStore, RedisTicketStore>();
        services.AddOptions<CookieAuthenticationOptions>(CookieAuthenticationDefaults.AuthenticationScheme)
            .Configure<ITicketStore>((o, store) => o.SessionStore = store);

        services.AddAuthentication(o =>
            {
                o.DefaultScheme = SmartScheme;
                o.DefaultChallengeScheme = SmartScheme;
            })
            // Bearer başlığı varsa JWT, yoksa oturum çerezi
            .AddPolicyScheme(SmartScheme, "Bearer veya oturum çerezi", o =>
                o.ForwardDefaultSelector = ctx =>
                    ctx.Request.Headers.Authorization.ToString().StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                        ? JwtBearerDefaults.AuthenticationScheme
                        : CookieAuthenticationDefaults.AuthenticationScheme)
            .AddJwtBearer(o =>
            {
                o.Authority = authority;
                o.RequireHttpsMetadata = false;
                o.BackchannelHttpHandler = new KeycloakBackchannelHandler(authority, internalAuthority);
                o.MapInboundClaims = false;
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = authority,
                    ValidAudience = kc["Audience"],
                    NameClaimType = "preferred_username",
                    RoleClaimType = RoleClaim,
                };
                o.Events = new JwtBearerEvents
                {
                    OnTokenValidated = ctx =>
                    {
                        if (ctx.Principal?.Identity is ClaimsIdentity identity)
                            AddRealmRoles(identity, identity.FindFirst("realm_access")?.Value);
                        return Task.CompletedTask;
                    },
                };
            })
            .AddCookie(o =>
            {
                o.Cookie.Name = "soykok.session";
                o.Cookie.HttpOnly = true;
                o.Cookie.SameSite = SameSiteMode.Lax;
                o.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
                o.ExpireTimeSpan = TimeSpan.FromHours(8);
                o.SlidingExpiration = true;
                // API olduğu için giriş sayfasına yönlendirmek yerine 401/403 dön
                o.Events.OnRedirectToLogin = ctx =>
                {
                    ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                };
                o.Events.OnRedirectToAccessDenied = ctx =>
                {
                    ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                };
            })
            .AddOpenIdConnect(OidcScheme, o =>
            {
                o.Authority = authority;
                o.RequireHttpsMetadata = false;
                o.BackchannelHttpHandler = new KeycloakBackchannelHandler(authority, internalAuthority);
                o.ClientId = kc["ClientId"];
                o.ClientSecret = kc["ClientSecret"];
                o.ResponseType = OpenIdConnectResponseType.Code;
                o.ResponseMode = OpenIdConnectResponseMode.Query;
                o.UsePkce = true;
                o.Scope.Clear();
                o.Scope.Add("openid");
                o.Scope.Add("profile");
                o.Scope.Add("email");
                o.CallbackPath = "/api/auth/callback";
                o.SignedOutCallbackPath = "/api/auth/signout-callback";
                o.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                o.SignOutScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                o.SaveTokens = true; // çıkışta id_token_hint için (Redis'te saklanır)
                o.MapInboundClaims = false;
                o.GetClaimsFromUserInfoEndpoint = false;
                // http://localhost üzerinde de çalışsın (SameSite=None için HTTPS gerekir)
                o.CorrelationCookie.SameSite = SameSiteMode.Lax;
                o.NonceCookie.SameSite = SameSiteMode.Lax;
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    NameClaimType = "preferred_username",
                    RoleClaimType = RoleClaim,
                };
                o.Events = new OpenIdConnectEvents
                {
                    // /api/auth/register → Keycloak'ta doğrudan kayıt formu (prompt=create)
                    OnRedirectToIdentityProvider = ctx =>
                    {
                        if (ctx.Properties.Items.TryGetValue(PromptItem, out var prompt) && !string.IsNullOrEmpty(prompt))
                            ctx.ProtocolMessage.Prompt = prompt;
                        return Task.CompletedTask;
                    },
                    // Roller id_token'da değil access_token'da gelir
                    OnTokenValidated = ctx =>
                    {
                        var accessToken = ctx.TokenEndpointResponse?.AccessToken;
                        if (ctx.Principal?.Identity is ClaimsIdentity identity && !string.IsNullOrEmpty(accessToken))
                        {
                            var jwt = new JsonWebToken(accessToken);
                            if (jwt.TryGetClaim("realm_access", out var realmAccess))
                                AddRealmRoles(identity, realmAccess.Value);
                        }
                        return Task.CompletedTask;
                    },
                };
            });

        services.AddAuthorizationBuilder()
            .AddPolicy(AdminPolicy, p => p.RequireRole("admin"));

        return services;
    }

    /// <summary>Keycloak rolleri "realm_access": { "roles": [...] } içinde gelir; bunları role claim'lerine çevirir.</summary>
    private static void AddRealmRoles(ClaimsIdentity identity, string? realmAccess)
    {
        if (string.IsNullOrWhiteSpace(realmAccess))
            return;

        using var doc = JsonDocument.Parse(realmAccess);
        if (!doc.RootElement.TryGetProperty("roles", out var roles) || roles.ValueKind != JsonValueKind.Array)
            return;

        foreach (var role in roles.EnumerateArray())
        {
            if (role.GetString() is { Length: > 0 } name && !identity.HasClaim(RoleClaim, name))
                identity.AddClaim(new Claim(RoleClaim, name));
        }
    }
}

/// <summary>
/// API konteyneri Keycloak'a tarayıcının adresiyle (http://localhost/...) ulaşamaz.
/// Sunucudan sunucuya giden istekleri (metadata, anahtarlar, token) iç adrese çevirir.
/// </summary>
public sealed class KeycloakBackchannelHandler(string publicAuthority, string? internalAuthority)
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
