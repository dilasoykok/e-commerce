using Microsoft.EntityFrameworkCore;
using Soykok.Application.Common.Abstractions;
using Soykok.Domain.Catalog;
using Soykok.Domain.Customers;
using Soykok.Domain.Inventory;
using Soykok.Domain.Ordering;
using Soykok.Domain.Reviews;

namespace Soykok.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IUnitOfWork
{
    // catalog
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<CategoryGroup> CategoryGroups => Set<CategoryGroup>();

    // customers
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<FavoriteProduct> FavoriteProducts => Set<FavoriteProduct>();

    // ordering
    public DbSet<Order> Orders => Set<Order>();

    // inventory
    public DbSet<StockItem> StockItems => Set<StockItem>();

    // reviews
    public DbSet<ProductReview> ProductReviews => Set<ProductReview>();

    public async Task<T> ExecuteInTransactionAsync<T>(
        Func<CancellationToken, Task<(T Result, bool Commit)>> action, CancellationToken ct = default)
    {
        await using var tx = await Database.BeginTransactionAsync(ct);
        var (result, commit) = await action(ct);
        if (commit) await tx.CommitAsync(ct);
        else
        {
            await tx.RollbackAsync(ct);
            ChangeTracker.Clear(); // kaydedilmeyen değişiklikler sonraki SaveChanges'e karışmasın
        }
        return result;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        modelBuilder.ApplySnakeCaseNames(); // en sonda: tüm kolonlar tanımlandıktan sonra
    }
}
