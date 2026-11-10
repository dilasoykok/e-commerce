using Soykok.Api.Http;
using Soykok.Application.Catalog.Admin;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Infrastructure.Identity;

namespace Soykok.Api.Endpoints;

/// <summary>
/// Kategori yönetimi (yalnızca admin). Her işlem güncel listeyi döner.
///   GET    /api/admin/categories
///   POST   /api/admin/categories                 { slug?, name, sortOrder?, groups: ["parke"] }   alt kategori
///   PUT    /api/admin/categories/{slug}          { name, sortOrder?, groups }
///   DELETE /api/admin/categories/{slug}          (içinde ürün varsa 409)
///   POST   /api/admin/category-groups            { slug?, label, sortOrder? }                    üst kategori
///   PUT    /api/admin/category-groups/{slug}     { label, sortOrder? }
///   DELETE /api/admin/category-groups/{slug}     (alt kategoriler silinmez)
/// </summary>
public static class AdminCategoryEndpoints
{
    public static RouteGroupBuilder MapAdminCategoryEndpoints(this RouteGroupBuilder api)
    {
        var categories = api.MapGroup("/admin/categories").WithTags("Admin").RequireAuthorization(AuthConstants.AdminPolicy);
        categories.MapGet("/", async (IQueryHandler<GetAdminCategoriesQuery, AdminCategoryList> h, CancellationToken ct) =>
            Results.Ok(await h.HandleAsync(new GetAdminCategoriesQuery(), ct)));
        categories.MapPost("/", (SaveCategoryRequest body, ICommandHandler<CreateCategoryCommand, Result<AdminCategoryList>> h, CancellationToken ct) =>
            Run(h.HandleAsync(new CreateCategoryCommand(body), ct)));
        categories.MapPut("/{slug}", (string slug, SaveCategoryRequest body, ICommandHandler<UpdateCategoryCommand, Result<AdminCategoryList>> h, CancellationToken ct) =>
            Run(h.HandleAsync(new UpdateCategoryCommand(slug, body), ct)));
        categories.MapDelete("/{slug}", (string slug, ICommandHandler<DeleteCategoryCommand, Result<AdminCategoryList>> h, CancellationToken ct) =>
            Run(h.HandleAsync(new DeleteCategoryCommand(slug), ct)));

        var groups = api.MapGroup("/admin/category-groups").WithTags("Admin").RequireAuthorization(AuthConstants.AdminPolicy);
        groups.MapPost("/", (SaveCategoryGroupRequest body, ICommandHandler<CreateCategoryGroupCommand, Result<AdminCategoryList>> h, CancellationToken ct) =>
            Run(h.HandleAsync(new CreateCategoryGroupCommand(body), ct)));
        groups.MapPut("/{slug}", (string slug, SaveCategoryGroupRequest body, ICommandHandler<UpdateCategoryGroupCommand, Result<AdminCategoryList>> h, CancellationToken ct) =>
            Run(h.HandleAsync(new UpdateCategoryGroupCommand(slug, body), ct)));
        groups.MapDelete("/{slug}", (string slug, ICommandHandler<DeleteCategoryGroupCommand, Result<AdminCategoryList>> h, CancellationToken ct) =>
            Run(h.HandleAsync(new DeleteCategoryGroupCommand(slug), ct)));

        return api;
    }

    private static async Task<IResult> Run(Task<Result<AdminCategoryList>> work) =>
        (await work).ToHttp(list => Results.Ok(list));
}
