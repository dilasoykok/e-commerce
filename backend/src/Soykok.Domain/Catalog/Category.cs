using Soykok.Domain.Common;

namespace Soykok.Domain.Catalog;

/// <summary>Alt kategori: laminat, masif, supurgelik ...</summary>
public sealed class Category
{
    private Category() { } // EF Core

    public Category(string slug, string name, int sortOrder)
    {
        Slug = Guard.NotEmpty(slug, "Kategori kodu");
        Name = Guard.NotEmpty(name, "Kategori adı");
        SortOrder = sortOrder;
    }

    public string Slug { get; private set; } = null!;
    public string Name { get; private set; } = null!;
    public int SortOrder { get; private set; }
}
