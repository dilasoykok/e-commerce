using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Soykok.Domain.Customers;
using Soykok.Domain.Ordering;

namespace Soykok.Infrastructure.Persistence.Configurations;

internal sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> e)
    {
        e.ToTable("orders", Schemas.Ordering, t =>
        {
            t.HasCheckConstraint("ck_orders_amounts", "subtotal >= 0 AND shipping_fee >= 0 AND total = subtotal + shipping_fee");
        });
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedNever();
        e.Property(x => x.Number).HasMaxLength(32);
        e.HasIndex(x => x.Number).IsUnique();

        // Üye silinse de sipariş kalır (misafir siparişine döner)
        e.HasOne<Customer>().WithMany().HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.SetNull);
        e.HasIndex(x => x.CustomerId);

        e.OwnsOne(x => x.Buyer, b =>
        {
            b.Property(x => x.Email).HasMaxLength(256);
            b.Property(x => x.FirstName).HasMaxLength(100);
            b.Property(x => x.LastName).HasMaxLength(100);
            b.Property(x => x.Phone).HasMaxLength(20);
            b.HasIndex(x => x.Email).HasDatabaseName("ix_orders_buyer_email"); // misafir sipariş takibi: numara + e-posta
        });
        e.Navigation(x => x.Buyer).IsRequired();

        e.OwnsOne(x => x.ShippingAddress, a => OwnedTypes.ConfigurePostalAddress(a));
        e.OwnsOne(x => x.Invoice, i => OwnedTypes.ConfigureInvoice(i));
        e.Navigation(x => x.Invoice).IsRequired();

        e.Property(x => x.DeliveryMethod).HasConversion<string>().HasMaxLength(16);
        e.Property(x => x.DeliveryNote).HasMaxLength(500);
        e.Property(x => x.PaymentMethod).HasConversion<string>().HasMaxLength(16);
        e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
        e.HasIndex(x => x.Status);
        e.HasIndex(x => x.PlacedAt);

        e.Property(x => x.Subtotal).HasPrecision(12, 2);
        e.Property(x => x.ShippingFee).HasPrecision(12, 2);
        e.Property(x => x.Total).HasPrecision(12, 2);

        e.HasMany(x => x.Items).WithOne().HasForeignKey(i => i.OrderId).OnDelete(DeleteBehavior.Cascade);
        e.Navigation(x => x.Items).UsePropertyAccessMode(PropertyAccessMode.Field);

        e.HasMany(x => x.StatusHistory).WithOne().HasForeignKey(h => h.OrderId).OnDelete(DeleteBehavior.Cascade);
        e.Navigation(x => x.StatusHistory).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

internal sealed class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> e)
    {
        e.ToTable("order_items", Schemas.Ordering, t =>
        {
            t.HasCheckConstraint("ck_order_items_quantity", $"quantity BETWEEN 1 AND {OrderItem.MaxQuantity}");
            t.HasCheckConstraint("ck_order_items_amounts", "unit_price > 0 AND line_total = unit_price * quantity");
        });
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedNever();

        // Ürün bilgisi sipariş anındaki haliyle saklanır; ürün silinse de sipariş bozulmasın diye FK yok
        e.Property(x => x.ProductId).HasMaxLength(64);
        e.Property(x => x.ProductName).HasMaxLength(256);
        e.Property(x => x.Brand).HasMaxLength(128);
        e.Property(x => x.Image).HasMaxLength(512);
        e.Property(x => x.Unit).HasMaxLength(16);
        e.Property(x => x.UnitPrice).HasPrecision(12, 2);
        e.Property(x => x.LineTotal).HasPrecision(12, 2);

        e.HasIndex(x => x.OrderId);
        e.HasIndex(x => x.ProductId);
    }
}

internal sealed class OrderStatusChangeConfiguration : IEntityTypeConfiguration<OrderStatusChange>
{
    public void Configure(EntityTypeBuilder<OrderStatusChange> e)
    {
        e.ToTable("order_status_history", Schemas.Ordering);
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedNever();
        e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
        e.Property(x => x.Note).HasMaxLength(500);
        e.HasIndex(x => x.OrderId);
    }
}
