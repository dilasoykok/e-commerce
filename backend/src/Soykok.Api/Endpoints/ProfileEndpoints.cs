using System.Security.Claims;
using Soykok.Api.Http;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Application.Customers;

namespace Soykok.Api.Endpoints;

/// <summary>
/// Üye profili ve adres defteri (giriş gerekir).
///   GET    /api/me/profile                 → ad, soyad, e-posta, telefon, kampanya izni
///   PUT    /api/me/profile                 { firstName, lastName, phone, marketingConsent }
///   GET    /api/me/addresses               → kayıtlı adresler (varsayılan en üstte)
///   POST   /api/me/addresses               { title, recipientName, phone, city, district, line, postalCode, isDefault }
///   PUT    /api/me/addresses/{id}          (aynı gövde)
///   DELETE /api/me/addresses/{id}
///   POST   /api/me/addresses/{id}/default
/// Adres işlemlerinin hepsi güncel listeyi döner.
/// E-posta ve şifre Keycloak'ta tutulur; burada değiştirilmez.
/// </summary>
public static class ProfileEndpoints
{
    public static RouteGroupBuilder MapProfileEndpoints(this RouteGroupBuilder api)
    {
        var profile = api.MapGroup("/me/profile").WithTags("Account").RequireAuthorization();

        profile.MapGet("/", async (ClaimsPrincipal user, IQueryHandler<GetMyProfileQuery, ProfileDto> h, CancellationToken ct) =>
            user.ToCurrentUser() is { } me
                ? Results.Ok(await h.HandleAsync(new GetMyProfileQuery(me), ct))
                : Results.Unauthorized());

        profile.MapPut("/", async (
                UpdateProfileRequest body, ClaimsPrincipal user,
                ICommandHandler<UpdateMyProfileCommand, Result<ProfileDto>> h, CancellationToken ct) =>
            user.ToCurrentUser() is { } me
                ? (await h.HandleAsync(new UpdateMyProfileCommand(me, body), ct)).ToHttp(p => Results.Ok(p))
                : Results.Unauthorized());

        var addresses = api.MapGroup("/me/addresses").WithTags("Account").RequireAuthorization();

        addresses.MapGet("/", async (ClaimsPrincipal user, IQueryHandler<GetMyAddressesQuery, IReadOnlyList<AddressDto>> h, CancellationToken ct) =>
            user.ToCurrentUser() is { } me
                ? Results.Ok(await h.HandleAsync(new GetMyAddressesQuery(me), ct))
                : Results.Unauthorized());

        addresses.MapPost("/", async (
                SaveAddressRequest body, ClaimsPrincipal user,
                ICommandHandler<CreateAddressCommand, Result<IReadOnlyList<AddressDto>>> h, CancellationToken ct) =>
            user.ToCurrentUser() is { } me
                ? (await h.HandleAsync(new CreateAddressCommand(me, body), ct)).ToHttp(list => Results.Ok(list))
                : Results.Unauthorized());

        addresses.MapPut("/{id:guid}", async (
                Guid id, SaveAddressRequest body, ClaimsPrincipal user,
                ICommandHandler<UpdateAddressCommand, Result<IReadOnlyList<AddressDto>>> h, CancellationToken ct) =>
            user.ToCurrentUser() is { } me
                ? (await h.HandleAsync(new UpdateAddressCommand(me, id, body), ct)).ToHttp(list => Results.Ok(list))
                : Results.Unauthorized());

        addresses.MapDelete("/{id:guid}", async (
                Guid id, ClaimsPrincipal user,
                ICommandHandler<DeleteAddressCommand, Result<IReadOnlyList<AddressDto>>> h, CancellationToken ct) =>
            user.ToCurrentUser() is { } me
                ? (await h.HandleAsync(new DeleteAddressCommand(me, id), ct)).ToHttp(list => Results.Ok(list))
                : Results.Unauthorized());

        addresses.MapPost("/{id:guid}/default", async (
                Guid id, ClaimsPrincipal user,
                ICommandHandler<SetDefaultAddressCommand, Result<IReadOnlyList<AddressDto>>> h, CancellationToken ct) =>
            user.ToCurrentUser() is { } me
                ? (await h.HandleAsync(new SetDefaultAddressCommand(me, id), ct)).ToHttp(list => Results.Ok(list))
                : Results.Unauthorized());

        return api;
    }
}
