using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Soykok.Api.Auth;
using Soykok.Infrastructure.Identity;

namespace Soykok.Api.Endpoints;

/// <summary>
/// Site girişi (BFF). Tarayıcı bu adreslere yönlendirilir; formlar Keycloak'ın sayfasındadır.
///   GET /api/auth/login?returnUrl=/siparislerim.html
///   GET /api/auth/register?returnUrl=/odeme.html
///   GET /api/auth/logout?returnUrl=/
///   GET /api/auth/user   → { authenticated, user }
/// </summary>
public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this RouteGroupBuilder api)
    {
        var auth = api.MapGroup("/auth").WithTags("Auth");

        auth.MapGet("/login", (string? returnUrl) =>
            Results.Challenge(Props(returnUrl), [AuthConstants.OidcScheme]));

        auth.MapGet("/register", (string? returnUrl) =>
        {
            var props = Props(returnUrl);
            props.Items[AuthConstants.PromptItem] = "create";
            return Results.Challenge(props, [AuthConstants.OidcScheme]);
        });

        auth.MapGet("/logout", async (HttpContext http, string? returnUrl) =>
        {
            var props = Props(returnUrl);
            var session = await http.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            if (!session.Succeeded)
                return Results.LocalRedirect(props.RedirectUri!);

            // Önce sitedeki oturum, sonra Keycloak oturumu kapanır
            return Results.SignOut(props,
                [CookieAuthenticationDefaults.AuthenticationScheme, AuthConstants.OidcScheme]);
        });

        // Sayfalar giriş durumunu buradan öğrenir (giriş yoksa da 200 döner)
        auth.MapGet("/user", (ClaimsPrincipal user) =>
            user.Identity?.IsAuthenticated == true
                ? Results.Ok(new { authenticated = true, user = UserInfo.From(user) })
                : Results.Ok(new { authenticated = false }));

        return api;
    }

    private static AuthenticationProperties Props(string? returnUrl) => new() { RedirectUri = SafeReturnUrl(returnUrl) };

    /// <summary>Yalnızca site içi adreslere dön (açık yönlendirme açığını önler).</summary>
    private static string SafeReturnUrl(string? url) =>
        !string.IsNullOrEmpty(url) && url.StartsWith('/') && !url.StartsWith("//") && !url.StartsWith("/\\")
            ? url
            : "/";
}
