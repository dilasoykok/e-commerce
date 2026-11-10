using Soykok.Domain.Common;

namespace Soykok.Domain.Catalog;

/// <summary>Üst kategori (parke, aksesuar ...) — birden çok alt kategoriyi kapsar.</summary>
public sealed class CategoryGroup
{
    private CategoryGroup() { } // EF Core

    public CategoryGroup(string slug, string label, IEnumerable<string> categorySlugs, int sortOrder)
    {
        Slug = Guard.NotEmpty(slug, "Grup kodu");
        Label = Guard.NotEmpty(label, "Grup adı");
        CategorySlugs = categorySlugs.ToArray();
        SortOrder = sortOrder;
    }

    public string Slug { get; private set; } = null!;
    public string Label { get; private set; } = null!;
    public string[] CategorySlugs { get; private set; } = [];
    public int SortOrder { get; private set; }

    public void Update(string label, int sortOrder)
    {
        Label = Guard.NotEmpty(label, "Grup adı");
        SortOrder = sortOrder;
    }

    public bool Contains(string categorySlug) => CategorySlugs.Contains(categorySlug);

    // Dizi her seferinde yenisiyle değiştirilir; EF Core değişikliği böyle kesin görür
    public void AddCategory(string categorySlug)
    {
        if (!Contains(categorySlug)) CategorySlugs = [.. CategorySlugs, categorySlug];
    }

    public void RemoveCategory(string categorySlug)
    {
        if (Contains(categorySlug)) CategorySlugs = CategorySlugs.Where(s => s != categorySlug).ToArray();
    }
}
