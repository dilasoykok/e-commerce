using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Soykok.Domain.Common;

namespace Soykok.Infrastructure.Persistence.Configurations;

/// <summary>Birden çok tabloda kullanılan değer nesnelerinin kolon ayarları.</summary>
internal static class OwnedTypes
{
    public static void ConfigurePostalAddress<TOwner>(OwnedNavigationBuilder<TOwner, PostalAddress> a)
        where TOwner : class
    {
        a.Property(x => x.City).HasMaxLength(64);
        a.Property(x => x.District).HasMaxLength(64);
        a.Property(x => x.Line).HasMaxLength(500);
        a.Property(x => x.PostalCode).HasMaxLength(10);
    }

    public static void ConfigureInvoice<TOwner>(OwnedNavigationBuilder<TOwner, InvoiceInfo> i)
        where TOwner : class
    {
        i.Property(x => x.Type).HasConversion<string>().HasMaxLength(16);
        i.Property(x => x.CompanyName).HasMaxLength(200);
        i.Property(x => x.TaxOffice).HasMaxLength(100);
        i.Property(x => x.TaxNumber).HasMaxLength(11);
    }
}
