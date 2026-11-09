using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Soykok.Domain.Catalog;
using Soykok.Domain.Inventory;

namespace Soykok.Infrastructure.Persistence.Configurations;

internal sealed class StockItemConfiguration : IEntityTypeConfiguration<StockItem>
{
    public void Configure(EntityTypeBuilder<StockItem> e)
    {
        e.ToTable("stock_items", Schemas.Inventory, t =>
        {
            t.HasCheckConstraint("ck_stock_items_quantity", "quantity >= 0");
        });
        e.HasKey(x => x.ProductId);
        e.Property(x => x.ProductId).HasMaxLength(64);
        e.Ignore(x => x.IsInStock);

        // Ürün başına tek stok satırı; ürün silinince stoğu da silinir
        e.HasOne<Product>().WithOne().HasForeignKey<StockItem>(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
    }
}
