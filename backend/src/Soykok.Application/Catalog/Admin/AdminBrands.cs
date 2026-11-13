using Soykok.Application.Common.Abstractions;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Domain.Catalog;

namespace Soykok.Application.Catalog.Admin;

/*
 * Markalar.
 *   Site:  GET /api/brands → bantta gösterilen markalar (ad + logo), sıralı
 *   Admin: marka ekle / düzenle / sil, logo yükle-değiştir, sıra, bantta göster/gizle
 * Ürünler markaya adıyla bağlıdır: marka adı değişince ürünlerdeki ad da güncellenir;
 * marka silinince ürünler silinmez (yalnızca banttan ve listeden kalkar).
 */

/* ---------- Sözleşmeler ---------- */

public sealed record PublicBrand(string Name, string? Logo);

public sealed record AdminBrandRow(string Slug, string Name, string? LogoUrl, int SortOrder, bool ShowInBand, int ProductCount);

public sealed record SaveBrandRequest(string? Name, string? LogoUrl, int? SortOrder, bool? ShowInBand);

public sealed record GetBrandsQuery;
public sealed record GetAdminBrandsQuery;
public sealed record CreateBrandCommand(SaveBrandRequest Request);
public sealed record UpdateBrandCommand(string Slug, SaveBrandRequest Request);
public sealed record DeleteBrandCommand(string Slug);

public static class BrandErrors
{
    public static Error NotFound(string slug) => Error.NotFound("brands.not_found", $"'{slug}' markası bulunamadı.");
}

/* ---------- İş kuralları ---------- */

public sealed class BrandsHandler(
    IBrandRepository brands,
    IUnitOfWork unitOfWork,
    CatalogSnapshotProvider catalog)
    : IQueryHandler<GetBrandsQuery, IReadOnlyList<PublicBrand>>,
      IQueryHandler<GetAdminBrandsQuery, IReadOnlyList<AdminBrandRow>>,
      ICommandHandler<CreateBrandCommand, Result<IReadOnlyList<AdminBrandRow>>>,
      ICommandHandler<UpdateBrandCommand, Result<IReadOnlyList<AdminBrandRow>>>,
      ICommandHandler<DeleteBrandCommand, Result<IReadOnlyList<AdminBrandRow>>>
{
    public async Task<IReadOnlyList<PublicBrand>> HandleAsync(GetBrandsQuery query, CancellationToken ct) =>
        (await brands.ListVisibleAsync(ct)).Select(b => new PublicBrand(b.Name, b.LogoUrl)).ToList();

    public async Task<IReadOnlyList<AdminBrandRow>> HandleAsync(GetAdminBrandsQuery query, CancellationToken ct) =>
        await ListAsync(ct);

    public async Task<Result<IReadOnlyList<AdminBrandRow>>> HandleAsync(CreateBrandCommand command, CancellationToken ct)
    {
        var all = await brands.ListForUpdateAsync(ct);
        if (Validate(command.Request, all, current: null) is { } invalid) return invalid;

        var r = command.Request;
        var name = r.Name!.Trim();
        var slug = UniqueSlug(name, all);
        var order = r.SortOrder ?? (all.Count == 0 ? 1 : all.Max(b => b.SortOrder) + 1);
        brands.Add(new Brand(slug, name, r.LogoUrl, order, r.ShowInBand ?? true));
        await unitOfWork.SaveChangesAsync(ct);
        return Result<IReadOnlyList<AdminBrandRow>>.Success(await ListAsync(ct));
    }

    public async Task<Result<IReadOnlyList<AdminBrandRow>>> HandleAsync(UpdateBrandCommand command, CancellationToken ct)
    {
        var all = await brands.ListForUpdateAsync(ct);
        var brand = all.FirstOrDefault(b => b.Slug == command.Slug);
        if (brand is null) return BrandErrors.NotFound(command.Slug);
        if (Validate(command.Request, all, brand) is { } invalid) return invalid;

        var r = command.Request;
        var oldName = brand.Name;
        var newName = r.Name!.Trim();
        brand.Update(newName, r.LogoUrl, r.SortOrder ?? brand.SortOrder, r.ShowInBand ?? brand.ShowInBand);
        await unitOfWork.SaveChangesAsync(ct);

        // Ad değiştiyse o markanın ürünleri de yeni adla görünsün (marka filtresi ad üzerinden çalışır)
        if (!string.Equals(oldName, newName, StringComparison.Ordinal))
        {
            await brands.RenameInProductsAsync(oldName, newName, ct);
            await catalog.InvalidateAsync(ct);
        }
        return Result<IReadOnlyList<AdminBrandRow>>.Success(await ListAsync(ct));
    }

    public async Task<Result<IReadOnlyList<AdminBrandRow>>> HandleAsync(DeleteBrandCommand command, CancellationToken ct)
    {
        var all = await brands.ListForUpdateAsync(ct);
        var brand = all.FirstOrDefault(b => b.Slug == command.Slug);
        if (brand is null) return BrandErrors.NotFound(command.Slug);

        brands.Remove(brand);
        await unitOfWork.SaveChangesAsync(ct);
        return Result<IReadOnlyList<AdminBrandRow>>.Success(await ListAsync(ct));
    }

    /* ---------- Yardımcılar ---------- */

    private async Task<IReadOnlyList<AdminBrandRow>> ListAsync(CancellationToken ct)
    {
        var list = await brands.ListForUpdateAsync(ct);
        var counts = await brands.CountProductsAsync(ct);
        return list
            .Select(b => new AdminBrandRow(b.Slug, b.Name, b.LogoUrl, b.SortOrder, b.ShowInBand, counts.GetValueOrDefault(b.Name)))
            .ToList();
    }

    private static Error? Validate(SaveBrandRequest r, IReadOnlyList<Brand> all, Brand? current)
    {
        var errors = new Dictionary<string, string[]>();
        var name = r.Name?.Trim() ?? "";
        var logo = r.LogoUrl?.Trim();

        if (name.Length is < 2 or > 100) errors["name"] = ["Marka adını yazın (2-100 karakter)."];
        else if (all.Any(b => b != current && string.Equals(b.Name, name, StringComparison.CurrentCultureIgnoreCase)))
            errors["name"] = ["Bu adla bir marka zaten var."];

        // Yalnızca sitedeki görseller: yüklenenler (/api/files/...) ya da hazır dosyalar (/images/...)
        if (!string.IsNullOrEmpty(logo) &&
            (!(logo.StartsWith("/api/files/") || logo.StartsWith("/images/")) || logo.Contains("..") || logo.Length > 500))
            errors["logoUrl"] = ["Logoyu \"Logo yükle\" düğmesiyle yükleyin."];

        if (r.SortOrder is < 0 or > 9999) errors["sortOrder"] = ["Sıra 0 ile 9999 arasında olmalı."];
        return errors.Count > 0 ? Error.Validation(errors) : null;
    }

    private static string UniqueSlug(string name, IReadOnlyList<Brand> all)
    {
        var baseSlug = AdminCategoriesHandler.Slugify(name);
        if (baseSlug.Length == 0) baseSlug = "marka";
        if (baseSlug.Length > 60) baseSlug = baseSlug[..60];
        var slug = baseSlug;
        for (var i = 2; all.Any(b => b.Slug == slug); i++) slug = $"{baseSlug}-{i}";
        return slug;
    }
}
