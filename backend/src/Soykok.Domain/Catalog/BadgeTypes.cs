namespace Soykok.Domain.Catalog;

/// <summary>Ürün kartındaki etiketin rengi.</summary>
public static class BadgeTypes
{
    public const string Sale = "sale";
    public const string New = "new";
    public const string Info = "info";

    public static readonly IReadOnlySet<string> All = new HashSet<string> { Sale, New, Info };
}
