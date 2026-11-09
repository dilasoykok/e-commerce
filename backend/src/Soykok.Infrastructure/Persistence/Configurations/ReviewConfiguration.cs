using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Soykok.Domain.Catalog;
using Soykok.Domain.Customers;
using Soykok.Domain.Reviews;

namespace Soykok.Infrastructure.Persistence.Configurations;

internal sealed class ProductReviewConfiguration : IEntityTypeConfiguration<ProductReview>
{
    public void Configure(EntityTypeBuilder<ProductReview> e)
    {
        e.ToTable("product_reviews", Schemas.Reviews, t =>
        {
            t.HasCheckConstraint("ck_product_reviews_rating",
                $"rating BETWEEN {ProductReview.MinRating} AND {ProductReview.MaxRating}");
        });
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedNever();
        e.Property(x => x.ProductId).HasMaxLength(64);
        e.Property(x => x.AuthorName).HasMaxLength(100);
        e.Property(x => x.Title).HasMaxLength(150);
        e.Property(x => x.Comment).HasMaxLength(2000);

        e.HasOne<Product>().WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        e.HasOne<Customer>().WithMany().HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Cascade);

        // Bir müşteri bir ürüne bir yorum yazabilir
        e.HasIndex(x => new { x.ProductId, x.CustomerId }).IsUnique();
        // Ürün sayfası: onaylı yorumlar
        e.HasIndex(x => new { x.ProductId, x.IsApproved });
    }
}
