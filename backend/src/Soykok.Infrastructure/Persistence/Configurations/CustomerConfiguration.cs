using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Soykok.Domain.Catalog;
using Soykok.Domain.Customers;

namespace Soykok.Infrastructure.Persistence.Configurations;

internal sealed class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> e)
    {
        e.ToTable("customers", Schemas.Customers);
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedNever();
        e.Property(x => x.IdentityId).HasMaxLength(64);
        e.Property(x => x.Email).HasMaxLength(256);
        e.Property(x => x.FirstName).HasMaxLength(100);
        e.Property(x => x.LastName).HasMaxLength(100);
        e.Property(x => x.Phone).HasMaxLength(20);

        // Keycloak kullanıcısı başına tek müşteri
        e.HasIndex(x => x.IdentityId).IsUnique();
        e.HasIndex(x => x.Email);

        e.HasMany(x => x.Addresses).WithOne().HasForeignKey(a => a.CustomerId).OnDelete(DeleteBehavior.Cascade);
        e.Navigation(x => x.Addresses).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

internal sealed class CustomerAddressConfiguration : IEntityTypeConfiguration<CustomerAddress>
{
    public void Configure(EntityTypeBuilder<CustomerAddress> e)
    {
        e.ToTable("customer_addresses", Schemas.Customers);
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedNever();
        e.Property(x => x.Title).HasMaxLength(50);
        e.Property(x => x.RecipientName).HasMaxLength(200);
        e.Property(x => x.Phone).HasMaxLength(20);

        e.OwnsOne(x => x.Address, a => OwnedTypes.ConfigurePostalAddress(a));
        e.Navigation(x => x.Address).IsRequired();
        e.OwnsOne(x => x.Invoice, i => OwnedTypes.ConfigureInvoice(i));

        e.HasIndex(x => x.CustomerId);
    }
}

internal sealed class FavoriteProductConfiguration : IEntityTypeConfiguration<FavoriteProduct>
{
    public void Configure(EntityTypeBuilder<FavoriteProduct> e)
    {
        e.ToTable("favorite_products", Schemas.Customers);
        e.HasKey(x => new { x.CustomerId, x.ProductId });
        e.Property(x => x.ProductId).HasMaxLength(64);

        e.HasOne<Customer>().WithMany().HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Cascade);
        e.HasOne<Product>().WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        e.HasIndex(x => x.ProductId);
    }
}
