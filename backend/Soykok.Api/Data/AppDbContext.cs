using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Soykok.Api.Domain;

namespace Soykok.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<CategoryGroup> CategoryGroups => Set<CategoryGroup>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Category>(e =>
        {
            e.ToTable("categories");
            e.HasKey(x => x.Slug);
            e.Property(x => x.Slug).HasMaxLength(64);
            e.Property(x => x.Name).HasMaxLength(128);
        });

        b.Entity<CategoryGroup>(e =>
        {
            e.ToTable("category_groups");
            e.HasKey(x => x.Slug);
            e.Property(x => x.Slug).HasMaxLength(64);
            e.Property(x => x.Label).HasMaxLength(128);
        });

        // Özellikler jsonb dizi olarak saklanır (sıra korunur)
        var specsConverter = new ValueConverter<List<ProductSpec>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<List<ProductSpec>>(v, (JsonSerializerOptions?)null) ?? new List<ProductSpec>());
        var specsComparer = new ValueComparer<List<ProductSpec>>(
            (a, c) => a!.SequenceEqual(c!),
            v => v.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
            v => v.ToList());

        b.Entity<Product>(e =>
        {
            e.ToTable("products");
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
            e.Property(x => x.Specs).HasConversion(specsConverter, specsComparer).HasColumnType("jsonb");

            e.HasOne<Category>().WithMany().HasForeignKey(x => x.CategorySlug).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.CategorySlug);
            e.HasIndex(x => x.Brand);
        });
    }
}
