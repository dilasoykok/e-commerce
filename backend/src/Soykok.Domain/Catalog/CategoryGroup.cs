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
}
