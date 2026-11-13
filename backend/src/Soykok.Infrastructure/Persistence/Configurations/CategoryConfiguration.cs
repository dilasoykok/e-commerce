using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Soykok.Domain.Catalog;

namespace Soykok.Infrastructure.Persistence.Configurations;

internal sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> e)
    {
        e.ToTable("categories", Schemas.Catalog);
        e.HasKey(x => x.Slug);
        e.Property(x => x.Slug).HasMaxLength(64);
        e.Property(x => x.Name).HasMaxLength(128);
    }
}

internal sealed class CategoryGroupConfiguration : IEntityTypeConfiguration<CategoryGroup>
{
    public void Configure(EntityTypeBuilder<CategoryGroup> e)
    {
        e.ToTable("category_groups", Schemas.Catalog);
        e.HasKey(x => x.Slug);
        e.Property(x => x.Slug).HasMaxLength(64);
        e.Property(x => x.Label).HasMaxLength(128);
    }
}

internal sealed class BrandConfiguration : IEntityTypeConfiguration<Brand>
{
    public void Configure(EntityTypeBuilder<Brand> e)
    {
        e.ToTable("brands", Schemas.Catalog);
        e.HasKey(x => x.Slug);
        e.Property(x => x.Slug).HasMaxLength(64);
        e.Property(x => x.Name).HasMaxLength(100);
        e.Property(x => x.LogoUrl).HasMaxLength(500);
        e.HasIndex(x => x.Name).IsUnique();
    }
}
