using Soykok.Api.Http;
using Soykok.Application.Catalog.Admin;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Infrastructure.Identity;

namespace Soykok.Api.Endpoints;

/// <summary>
/// Markalar.
///   GET    /api/brands                 → sitede gösterilen markalar [{ name, logo }] (herkes)
///   GET    /api/admin/brands           → tüm markalar + ürün sayıları (admin)
///   POST   /api/admin/brands           { name, logoUrl?, sortOrder?, showInBand? }
///   PUT    /api/admin/brands/{slug}    (aynı gövde; ad değişirse ürünlerdeki marka adı da güncellenir)
///   DELETE /api/admin/brands/{slug}    (ürünler silinmez)
/// Logo, önce POST /api/admin/uploads?klasor=brands ile yüklenir, dönen adres logoUrl'e yazılır.
/// </summary>
public static class BrandEndpoints
{
    public static RouteGroupBuilder MapBrandEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/brands", async (IQueryHandler<GetBrandsQuery, IReadOnlyList<PublicBrand>> h, CancellationToken ct) =>
                Results.Ok(await h.HandleAsync(new GetBrandsQuery(), ct)))
            .WithTags("Catalog")
            .AllowAnonymous();

        var admin = api.MapGroup("/admin/brands").WithTags("Admin").RequireAuthorization(AuthConstants.AdminPolicy);
        admin.MapGet("/", async (IQueryHandler<GetAdminBrandsQuery, IReadOnlyList<AdminBrandRow>> h, CancellationToken ct) =>
            Results.Ok(await h.HandleAsync(new GetAdminBrandsQuery(), ct)));
        admin.MapPost("/", async (
                SaveBrandRequest body, ICommandHandler<CreateBrandCommand, Result<IReadOnlyList<AdminBrandRow>>> h, CancellationToken ct) =>
            (await h.HandleAsync(new CreateBrandCommand(body), ct)).ToHttp(list => Results.Ok(list)));
        admin.MapPut("/{slug}", async (
                string slug, SaveBrandRequest body, ICommandHandler<UpdateBrandCommand, Result<IReadOnlyList<AdminBrandRow>>> h, CancellationToken ct) =>
            (await h.HandleAsync(new UpdateBrandCommand(slug, body), ct)).ToHttp(list => Results.Ok(list)));
        admin.MapDelete("/{slug}", async (
                string slug, ICommandHandler<DeleteBrandCommand, Result<IReadOnlyList<AdminBrandRow>>> h, CancellationToken ct) =>
            (await h.HandleAsync(new DeleteBrandCommand(slug), ct)).ToHttp(list => Results.Ok(list)));

        return api;
    }
}
