using System.Text;
using Microsoft.EntityFrameworkCore;

namespace Soykok.Infrastructure.Persistence;

/// <summary>
/// Kolon, anahtar, ilişki ve index adlarını PostgreSQL alışkanlığına uygun snake_case yapar:
/// OldPrice → old_price, ShippingAddress.City → shipping_address_city, IX_orders_CustomerId → ix_orders_customer_id.
/// (Tablo adları yapılandırmalarda zaten snake_case verilir.)
/// </summary>
internal static class SnakeCaseNaming
{
    public static void ApplySnakeCaseNames(this ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            // Tabloya gömülü değer nesneleri (PostalAddress, BuyerInfo ...) sahibinin satırını paylaşır:
            // anahtar kolonları sahibinin "id" kolonudur ve EF bunu kendisi eşler; o kolonlara ve
            // sahibine bağlayan ilişkiye dokunmuyoruz. (Anahtar adı yine dönüştürülür: pk_<tablo>.)
            var owned = entity.IsOwned();
            // Gömülü kolonlara sahiplik adını ön ek yap: Buyer.Email → buyer_email, Invoice.Type → invoice_type
            var prefix = owned && entity.FindOwnership()?.PrincipalToDependent?.Name is { } navigation
                ? ToSnakeCase(navigation) + "_"
                : string.Empty;

            foreach (var property in entity.GetProperties())
            {
                if (owned && property.IsPrimaryKey()) continue;
                var name = owned ? property.Name : property.GetColumnName();
                property.SetColumnName(prefix + ToSnakeCase(name));
            }

            foreach (var key in entity.GetKeys())
                if (key.GetName() is { } name) key.SetName(ToSnakeCase(name));

            if (!owned)
            {
                foreach (var foreignKey in entity.GetForeignKeys())
                    if (foreignKey.GetConstraintName() is { } name) foreignKey.SetConstraintName(ToSnakeCase(name));
            }

            foreach (var index in entity.GetIndexes())
                if (index.GetDatabaseName() is { } name) index.SetDatabaseName(ToSnakeCase(name));
        }
    }

    internal static string ToSnakeCase(string name)
    {
        var sb = new StringBuilder(name.Length + 8);
        for (var i = 0; i < name.Length; i++)
        {
            var c = name[i];
            if (char.IsUpper(c))
            {
                var prev = i > 0 ? name[i - 1] : '_';
                var next = i + 1 < name.Length ? name[i + 1] : '_';
                var wordStart = prev != '_' &&
                                (char.IsLower(prev) || char.IsDigit(prev) || (char.IsUpper(prev) && char.IsLower(next)));
                if (wordStart) sb.Append('_');
                sb.Append(char.ToLowerInvariant(c));
            }
            else
            {
                sb.Append(c);
            }
        }
        return sb.ToString();
    }
}
