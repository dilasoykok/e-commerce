using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Soykok.Api.Infrastructure;

public static class KeycloakAuth
{
    public const string RoleClaim = "role";
    public const string AdminPolicy = "Admin";

    public static IServiceCollection AddKeycloakAuth(this IServiceCollection services, IConfiguration config)
    {
        var kc = config.GetSection("Keycloak");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(o =>
            {
                // Metadata iç ağdan (keycloak:8080) çekilir, token'daki issuer ise
                // tarayıcının gördüğü adrestir (http://localhost/auth/realms/soykok).
                o.MetadataAddress = kc["MetadataAddress"]!;
                o.RequireHttpsMetadata = false;
                o.MapInboundClaims = false;
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = kc["Issuer"],
                    ValidAudience = kc["Audience"],
                    NameClaimType = "preferred_username",
                    RoleClaimType = RoleClaim,
                };
                o.Events = new JwtBearerEvents { OnTokenValidated = AddRealmRoles };
            });

        services.AddAuthorizationBuilder()
            .AddPolicy(AdminPolicy, p => p.RequireRole("admin"));

        return services;
    }

    /// <summary>Keycloak rolleri "realm_access": { "roles": [...] } içinde gelir; bunları role claim'lerine çevirir.</summary>
    private static Task AddRealmRoles(TokenValidatedContext ctx)
    {
        if (ctx.Principal?.Identity is not ClaimsIdentity identity)
            return Task.CompletedTask;

        var realmAccess = identity.FindFirst("realm_access")?.Value;
        if (string.IsNullOrWhiteSpace(realmAccess))
            return Task.CompletedTask;

        using var doc = JsonDocument.Parse(realmAccess);
        if (doc.RootElement.TryGetProperty("roles", out var roles) && roles.ValueKind == JsonValueKind.Array)
        {
            foreach (var role in roles.EnumerateArray())
            {
                if (role.GetString() is { Length: > 0 } name)
                    identity.AddClaim(new Claim(RoleClaim, name));
            }
        }

        return Task.CompletedTask;
    }
}
