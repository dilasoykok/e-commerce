using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Soykok.Domain.Catalog;

namespace Soykok.Infrastructure.Persistence.Configurations;

internal sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> e)
    {
        e.ToTable("products", Schemas.Catalog);
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).HasMaxLength(64);
        e.Property(x => x.Name).HasMaxLength(256);
        e.Property(x => x.Brand).HasMaxLength(128);
        e.Property(x => x.CategorySlug).HasMaxLength(64);
        e.Property(x => x.Unit).HasMaxLength(16);
        e.Property(x => x.Image).HasMaxLength(512);
        e.Property(x => x.Badge).HasMaxLength(64);
        e.Property(x => x.BadgeType).HasMaxLength(16);
        e.Property(x => x.Price).HasPrecision(12, 2);
        e.Property(x => x.OldPrice).HasPrecision(12, 2);
        e.Property(x => x.BoxM2).HasPrecision(8, 2);
        e.Ignore(x => x.IsDiscounted);

        // Özellikler jsonb dizi olarak saklanır (sıra korunur)
        var specsConverter = new ValueConverter<List<ProductSpec>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<List<ProductSpec>>(v, (JsonSerializerOptions?)null) ?? new List<ProductSpec>());
        var specsComparer = new ValueComparer<List<ProductSpec>>(
            (a, b) => a!.SequenceEqual(b!),
            v => v.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
            v => v.ToList());
        e.Property(x => x.Specs).HasConversion(specsConverter, specsComparer).HasColumnType("jsonb");

        e.HasOne<Category>().WithMany().HasForeignKey(x => x.CategorySlug).OnDelete(DeleteBehavior.Restrict);
        e.HasIndex(x => x.CategorySlug);
        e.HasIndex(x => x.Brand);
    }
}
