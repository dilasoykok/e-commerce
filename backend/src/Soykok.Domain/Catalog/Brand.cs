using Soykok.Domain.Common;

namespace Soykok.Domain.Catalog;

/// <summary>
/// Marka (ana sayfadaki "Popüler Markalar" bandı, Hakkımızda). Ürünler markaya adıyla bağlıdır
/// (Product.Brand); marka adı değişince o markanın ürünleri de yeni adla güncellenir.
/// </summary>
public sealed class Brand
{
    private Brand() { } // EF Core

    public Brand(string slug, string name, string? logoUrl, int sortOrder, bool showInBand)
    {
        Slug = Guard.NotEmpty(slug, "Marka kodu");
        Name = Guard.NotEmpty(name, "Marka adı");
        LogoUrl = Guard.TrimToNull(logoUrl);
        SortOrder = sortOrder;
        ShowInBand = showInBand;
    }

    public string Slug { get; private set; } = null!;
    public string Name { get; private set; } = null!;
    /// <summary>Yüklenen logo (/api/files/brands/...) ya da sitedeki hazır dosya (/images/brands/...). Boşsa adı yazılır.</summary>
    public string? LogoUrl { get; private set; }
    public int SortOrder { get; private set; }
    /// <summary>Ana sayfadaki kayan bantta gösterilsin mi</summary>
    public bool ShowInBand { get; private set; }

    public void Update(string name, string? logoUrl, int sortOrder, bool showInBand)
    {
        Name = Guard.NotEmpty(name, "Marka adı");
        LogoUrl = Guard.TrimToNull(logoUrl);
        SortOrder = sortOrder;
        ShowInBand = showInBand;
    }
}
