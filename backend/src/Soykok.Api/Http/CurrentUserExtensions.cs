using System.Security.Claims;
using Soykok.Application.Ordering.Contracts;

namespace Soykok.Api.Http;

public static class CurrentUserExtensions
{
    /// <summary>Oturum çerezinden ya da Bearer token'dan kullanıcı ("sub" yoksa null)</summary>
    public static CurrentUser? ToCurrentUser(this ClaimsPrincipal user)
    {
        if (user.Identity?.IsAuthenticated != true) return null;
        var sub = user.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(sub)) return null;
        return new CurrentUser(
            sub,
            user.FindFirst("email")?.Value ?? "",
            user.FindFirst("given_name")?.Value ?? user.FindFirst("name")?.Value ?? "",
            user.FindFirst("family_name")?.Value ?? "");
    }
}
