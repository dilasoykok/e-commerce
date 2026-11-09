using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Soykok.Domain.Catalog;

namespace Soykok.Infrastructure.Persistence.Configurations;

internal sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> e)
    {
        e.ToTable("categories");
        e.HasKey(x => x.Slug);
        e.Property(x => x.Slug).HasMaxLength(64);
        e.Property(x => x.Name).HasMaxLength(128);
    }
}

internal sealed class CategoryGroupConfiguration : IEntityTypeConfiguration<CategoryGroup>
{
    public void Configure(EntityTypeBuilder<CategoryGroup> e)
    {
        e.ToTable("category_groups");
        e.HasKey(x => x.Slug);
        e.Property(x => x.Slug).HasMaxLength(64);
        e.Property(x => x.Label).HasMaxLength(128);
    }
}
