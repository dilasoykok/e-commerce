namespace Soykok.Infrastructure.Persistence;

/// <summary>Her modül PostgreSQL'de kendi şemasında durur (catalog.products, ordering.orders ...).</summary>
internal static class Schemas
{
    public const string Catalog = "catalog";
    public const string Customers = "customers";
    public const string Ordering = "ordering";
    public const string Inventory = "inventory";
    public const string Reviews = "reviews";
}
