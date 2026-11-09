using System.Security.Claims;
using Soykok.Infrastructure.Identity;

namespace Soykok.Api.Auth;

/// <summary>Giriş yapmış kullanıcının bilgileri (Keycloak token'ından).</summary>
public sealed record UserInfo(
    string? Id,
    string? Username,
    string? Email,
    string? FirstName,
    string? LastName,
    string? Name,
    string[] Roles)
{
    public static UserInfo From(ClaimsPrincipal user) => new(
        user.FindFirst("sub")?.Value,
        user.Identity?.Name,
        user.FindFirst("email")?.Value,
        user.FindFirst("given_name")?.Value,
        user.FindFirst("family_name")?.Value,
        user.FindFirst("name")?.Value,
        user.FindAll(AuthConstants.RoleClaim).Select(c => c.Value).Distinct().ToArray());
}
