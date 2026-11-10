using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Soykok.Application.Common.Abstractions;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Domain.Catalog;

namespace Soykok.Application.Catalog.Admin;

/*
 * Kategori yönetimi (admin).
 *   Üst kategori (CategoryGroup): menüdeki başlık — Parke, Aksesuarlar ...
 *   Alt kategori (Category):      ürünün bağlı olduğu kategori — Laminat, Masif ...
 * Bir alt kategori birden çok üst kategoride olabilir (ör. Laminat hem "Parke" hem "Zemin Kaplama").
 * Kodlar adres çubuğunda aynı parametreyle kullanıldığı için (/urunler?kategori=parke)
 * üst ve alt kategori kodları birbirinden de farklı olmalı.
 */

/* ---------- İstek / cevap ---------- */

/// <param name="Slug">Yalnızca eklemede: adres kodu (boşsa addan üretilir, sonradan değişmez)</param>
/// <param name="Groups">Bağlı olduğu üst kategorilerin kodları</param>
public sealed record SaveCategoryRequest(string? Slug, string? Name, int? SortOrder, string[]? Groups);

public sealed record SaveCategoryGroupRequest(string? Slug, string? Label, int? SortOrder);

public sealed record AdminCategoryRow(string Slug, string Name, int SortOrder, int ProductCount, string[] Groups);
public sealed record AdminCategoryGroupRow(string Slug, string Label, int SortOrder, string[] Categories);
public sealed record AdminCategoryList(IReadOnlyList<AdminCategoryRow> Categories, IReadOnlyList<AdminCategoryGroupRow> Groups);

public sealed record GetAdminCategoriesQuery;
public sealed record CreateCategoryCommand(SaveCategoryRequest Request);
public sealed record UpdateCategoryCommand(string Slug, SaveCategoryRequest Request);
public sealed record DeleteCategoryCommand(string Slug);
public sealed record CreateCategoryGroupCommand(SaveCategoryGroupRequest Request);
public sealed record UpdateCategoryGroupCommand(string Slug, SaveCategoryGroupRequest Request);
public sealed record DeleteCategoryGroupCommand(string Slug);

/* ---------- İşleyici ---------- */

/// <summary>Tüm kategori işlemleri; her işlem sonunda güncel listeyi döner (ekran tek seferde tazelenir).</summary>
public sealed partial class AdminCategoriesHandler(
    ICategoryRepository repository,
    IUnitOfWork unitOfWork,
    CatalogSnapshotProvider catalog)
    : IQueryHandler<GetAdminCategoriesQuery, AdminCategoryList>,
      ICommandHandler<CreateCategoryCommand, Result<AdminCategoryList>>,
      ICommandHandler<UpdateCategoryCommand, Result<AdminCategoryList>>,
      ICommandHandler<DeleteCategoryCommand, Result<AdminCategoryList>>,
      ICommandHandler<CreateCategoryGroupCommand, Result<AdminCategoryList>>,
      ICommandHandler<UpdateCategoryGroupCommand, Result<AdminCategoryList>>,
      ICommandHandler<DeleteCategoryGroupCommand, Result<AdminCategoryList>>
{
    private const int MaxName = 128;
    private const int MaxSlug = 64;

    public async Task<AdminCategoryList> HandleAsync(GetAdminCategoriesQuery query, CancellationToken ct)
    {
        var categories = await repository.ListForUpdateAsync(ct);
        var groups = await repository.ListGroupsForUpdateAsync(ct);
        return await ToListAsync(categories, groups, ct);
    }

    /* ---------- Alt kategori ---------- */

    public async Task<Result<AdminCategoryList>> HandleAsync(CreateCategoryCommand command, CancellationToken ct)
    {
        var (categories, groups) = await LoadAsync(ct);
        var r = command.Request;
        var errors = new Dictionary<string, string[]>();

        var name = CheckName(r.Name, "name", "Kategori adını girin.", errors);
        var slug = PickSlug(r.Slug, name, categories, groups, errors);
        var groupSlugs = CheckGroups(r.Groups, groups, errors);
        var sortOrder = CheckSortOrder(r.SortOrder, errors) ?? NextOrder(categories.Select(c => c.SortOrder));
        if (errors.Count > 0) return Error.Validation(errors);

        repository.Add(new Category(slug!, name!, sortOrder));
        foreach (var g in groups) if (groupSlugs.Contains(g.Slug)) g.AddCategory(slug!);

        return await SaveAsync(ct);
    }

    public async Task<Result<AdminCategoryList>> HandleAsync(UpdateCategoryCommand command, CancellationToken ct)
    {
        var (categories, groups) = await LoadAsync(ct);
        var category = categories.FirstOrDefault(c => c.Slug == command.Slug);
        if (category is null) return CategoryNotFound(command.Slug);

        var r = command.Request;
        var errors = new Dictionary<string, string[]>();
        var name = CheckName(r.Name, "name", "Kategori adını girin.", errors);
        var groupSlugs = CheckGroups(r.Groups, groups, errors);
        var sortOrder = CheckSortOrder(r.SortOrder, errors) ?? category.SortOrder;
        if (errors.Count > 0) return Error.Validation(errors);

        category.Update(name!, sortOrder);
        foreach (var g in groups)
        {
            if (groupSlugs.Contains(g.Slug)) g.AddCategory(category.Slug);
            else g.RemoveCategory(category.Slug);
        }

        return await SaveAsync(ct);
    }

    public async Task<Result<AdminCategoryList>> HandleAsync(DeleteCategoryCommand command, CancellationToken ct)
    {
        var (categories, groups) = await LoadAsync(ct);
        var category = categories.FirstOrDefault(c => c.Slug == command.Slug);
        if (category is null) return CategoryNotFound(command.Slug);

        var counts = await repository.CountProductsAsync(ct);
        if (counts.GetValueOrDefault(category.Slug) is var n and > 0)
            return Error.Conflict("catalog.category_in_use",
                $"\"{category.Name}\" kategorisinde {n} ürün var. Önce bu ürünleri başka kategoriye taşıyın ya da silin.");

        foreach (var g in groups) g.RemoveCategory(category.Slug);
        repository.Remove(category);
        return await SaveAsync(ct);
    }

    /* ---------- Üst kategori ---------- */

    public async Task<Result<AdminCategoryList>> HandleAsync(CreateCategoryGroupCommand command, CancellationToken ct)
    {
        var (categories, groups) = await LoadAsync(ct);
        var r = command.Request;
        var errors = new Dictionary<string, string[]>();

        var label = CheckName(r.Label, "label", "Üst kategori adını girin.", errors);
        var slug = PickSlug(r.Slug, label, categories, groups, errors);
        var sortOrder = CheckSortOrder(r.SortOrder, errors) ?? NextOrder(groups.Select(g => g.SortOrder));
        if (errors.Count > 0) return Error.Validation(errors);

        repository.Add(new CategoryGroup(slug!, label!, [], sortOrder));
        return await SaveAsync(ct);
    }

    public async Task<Result<AdminCategoryList>> HandleAsync(UpdateCategoryGroupCommand command, CancellationToken ct)
    {
        var (_, groups) = await LoadAsync(ct);
        var group = groups.FirstOrDefault(g => g.Slug == command.Slug);
        if (group is null) return GroupNotFound(command.Slug);

        var r = command.Request;
        var errors = new Dictionary<string, string[]>();
        var label = CheckName(r.Label, "label", "Üst kategori adını girin.", errors);
        var sortOrder = CheckSortOrder(r.SortOrder, errors) ?? group.SortOrder;
        if (errors.Count > 0) return Error.Validation(errors);

        group.Update(label!, sortOrder);
        return await SaveAsync(ct);
    }

    /// <summary>Üst kategori silinir; alt kategoriler ve ürünler yerinde kalır.</summary>
    public async Task<Result<AdminCategoryList>> HandleAsync(DeleteCategoryGroupCommand command, CancellationToken ct)
    {
        var (_, groups) = await LoadAsync(ct);
        var group = groups.FirstOrDefault(g => g.Slug == command.Slug);
        if (group is null) return GroupNotFound(command.Slug);

        repository.Remove(group);
        return await SaveAsync(ct);
    }

    /* ---------- Yardımcılar ---------- */

    private async Task<(List<Category>, List<CategoryGroup>)> LoadAsync(CancellationToken ct) =>
        (await repository.ListForUpdateAsync(ct), await repository.ListGroupsForUpdateAsync(ct));

    private async Task<Result<AdminCategoryList>> SaveAsync(CancellationToken ct)
    {
        await unitOfWork.SaveChangesAsync(ct);
        await catalog.InvalidateAsync(ct); // site menüsü ve filtreler yeni kategorileri görsün
        return await HandleAsync(new GetAdminCategoriesQuery(), ct);
    }

    private async Task<AdminCategoryList> ToListAsync(List<Category> categories, List<CategoryGroup> groups, CancellationToken ct)
    {
        var counts = await repository.CountProductsAsync(ct);
        var order = categories.Select((c, i) => (c.Slug, i)).ToDictionary(x => x.Slug, x => x.i);
        return new AdminCategoryList(
            categories
                .OrderBy(c => c.SortOrder).ThenBy(c => c.Name)
                .Select(c => new AdminCategoryRow(c.Slug, c.Name, c.SortOrder, counts.GetValueOrDefault(c.Slug),
                    groups.Where(g => g.Contains(c.Slug)).Select(g => g.Slug).ToArray()))
                .ToList(),
            groups
                .OrderBy(g => g.SortOrder).ThenBy(g => g.Label)
                .Select(g => new AdminCategoryGroupRow(g.Slug, g.Label, g.SortOrder,
                    g.CategorySlugs.Where(order.ContainsKey).OrderBy(s => order[s]).ToArray()))
                .ToList());
    }

    private static string? CheckName(string? value, string field, string required, Dictionary<string, string[]> errors)
    {
        var name = value?.Trim();
        if (string.IsNullOrEmpty(name)) errors[field] = [required];
        else if (name.Length > MaxName) errors[field] = [$"En fazla {MaxName} karakter olabilir."];
        return name;
    }

    private static int? CheckSortOrder(int? value, Dictionary<string, string[]> errors)
    {
        if (value is < 0 or > 100_000) errors["sortOrder"] = ["Sıra 0 ile 100000 arasında olmalı."];
        return value;
    }

    private static int NextOrder(IEnumerable<int> existing) => existing.DefaultIfEmpty(0).Max() + 1;

    private static HashSet<string> CheckGroups(string[]? requested, List<CategoryGroup> groups, Dictionary<string, string[]> errors)
    {
        var wanted = (requested ?? []).Select(s => s.Trim()).Where(s => s.Length > 0).ToHashSet();
        var unknown = wanted.Where(s => groups.All(g => g.Slug != s)).ToList();
        if (unknown.Count > 0) errors["groups"] = [$"Üst kategori bulunamadı: {string.Join(", ", unknown)}"];
        return wanted;
    }

    /// <summary>Kod verildiyse doğrular; verilmediyse addan üretir ("Kapı Kolu" → "kapi-kolu", çakışırsa "-2").</summary>
    private static string? PickSlug(
        string? requested, string? name, List<Category> categories, List<CategoryGroup> groups, Dictionary<string, string[]> errors)
    {
        bool Taken(string s) => categories.Any(c => c.Slug == s) || groups.Any(g => g.Slug == s);

        if (!string.IsNullOrWhiteSpace(requested))
        {
            var slug = requested.Trim().ToLowerInvariant();
            if (slug.Length > MaxSlug || !SlugRegex().IsMatch(slug))
                errors["slug"] = ["Kod yalnızca küçük harf (a-z), rakam ve tire içerebilir. Ör. kapi-kolu"];
            else if (Taken(slug))
                errors["slug"] = [$"\"{slug}\" kodu başka bir kategoride kullanılıyor."];
            return slug;
        }

        if (string.IsNullOrEmpty(name)) return null; // ad hatası zaten yazıldı
        var baseSlug = Slugify(name);
        if (baseSlug.Length == 0)
        {
            errors["slug"] = ["Addan kod üretilemedi; kodu elle yazın."];
            return null;
        }

        var candidate = baseSlug;
        for (var i = 2; Taken(candidate); i++) candidate = $"{baseSlug[..Math.Min(baseSlug.Length, MaxSlug - 4)]}-{i}";
        return candidate;
    }

    public static string Slugify(string text)
    {
        var map = new Dictionary<char, string>
        {
            ['ı'] = "i", ['İ'] = "i", ['ş'] = "s", ['Ş'] = "s", ['ğ'] = "g", ['Ğ'] = "g",
            ['ü'] = "u", ['Ü'] = "u", ['ö'] = "o", ['Ö'] = "o", ['ç'] = "c", ['Ç'] = "c",
        };
        var sb = new StringBuilder();
        foreach (var ch in text.Trim())
        {
            if (map.TryGetValue(ch, out var r)) { sb.Append(r); continue; }
            // Diğer aksanlı harfler: é → e
            foreach (var c in ch.ToString().Normalize(NormalizationForm.FormD))
                if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                    sb.Append(char.ToLowerInvariant(c));
        }
        var slug = NonSlugRegex().Replace(sb.ToString(), "-").Trim('-');
        return slug.Length <= MaxSlug ? slug : slug[..MaxSlug].Trim('-');
    }

    private static Error CategoryNotFound(string slug) =>
        Error.NotFound("catalog.category_not_found", $"'{slug}' kodlu alt kategori bulunamadı.");

    private static Error GroupNotFound(string slug) =>
        Error.NotFound("catalog.group_not_found", $"'{slug}' kodlu üst kategori bulunamadı.");

    [GeneratedRegex("^[a-z0-9]+(-[a-z0-9]+)*$")]
    private static partial Regex SlugRegex();

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonSlugRegex();
}
