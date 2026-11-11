using Microsoft.EntityFrameworkCore;
using Soykok.Application.Common.Abstractions;
using Soykok.Domain.Customers;
using Soykok.Domain.Ordering;

namespace Soykok.Infrastructure.Persistence.Repositories;

internal sealed class OrderRepository(AppDbContext db) : IOrderRepository
{
    public void Add(Order order) => db.Orders.Add(order);

    public Task<bool> NumberExistsAsync(string number, CancellationToken ct) =>
        db.Orders.AnyAsync(o => o.Number == number, ct);

    public Task<Order?> FindByNumberAsync(string number, CancellationToken ct) =>
        db.Orders.AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .AsSplitQuery()
            .FirstOrDefaultAsync(o => o.Number == number, ct);

    public async Task<IReadOnlyList<(string Number, string? PaymentToken)>> ListPendingCardPaymentsAsync(
        DateTimeOffset placedBefore, int max, CancellationToken ct)
    {
        var rows = await db.Orders.AsNoTracking()
            .Where(o => o.PaymentMethod == PaymentMethod.Card && o.Status == OrderStatus.AwaitingPayment && o.PlacedAt < placedBefore)
            .OrderBy(o => o.PlacedAt)
            .Take(max)
            .Select(o => new { o.Number, o.PaymentToken })
            .ToListAsync(ct);
        return rows.Select(r => (r.Number, r.PaymentToken)).ToList();
    }

    public Task<bool> HasPurchasedAsync(Guid customerId, string productId, CancellationToken ct) =>
        db.Orders.AnyAsync(o => o.CustomerId == customerId
            && o.Status != OrderStatus.AwaitingPayment && o.Status != OrderStatus.Cancelled
            && o.Items.Any(i => i.ProductId == productId), ct);

    public Task<Order?> GetForUpdateAsync(string number, CancellationToken ct) =>
        db.Orders
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .AsSplitQuery()
            .FirstOrDefaultAsync(o => o.Number == number, ct);

    public async Task<(int Total, IReadOnlyList<Order> Items)> SearchAsync(
        OrderStatus? status, string? search, int page, int pageSize, CancellationToken ct)
    {
        var query = db.Orders.AsNoTracking().AsQueryable();
        if (status is { } s) query = query.Where(o => o.Status == s);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var like = $"%{search.Replace("%", "").Replace("_", "")}%";
            query = query.Where(o =>
                EF.Functions.ILike(o.Number, like) ||
                EF.Functions.ILike(o.Buyer.Email, like) ||
                EF.Functions.ILike(o.Buyer.FirstName + " " + o.Buyer.LastName, like) ||
                EF.Functions.ILike(o.Buyer.Phone, like));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(o => o.PlacedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(o => o.Items)
            .AsSplitQuery()
            .ToListAsync(ct);
        return (total, items);
    }

    public async Task<IReadOnlyList<Order>> ListByCustomerAsync(Guid customerId, int take, CancellationToken ct) =>
        await db.Orders.AsNoTracking()
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.PlacedAt)
            .Take(take)
            .Include(o => o.Items)
            .AsSplitQuery()
            .ToListAsync(ct);
}

internal sealed class CustomerRepository(AppDbContext db) : ICustomerRepository
{
    public Task<Customer?> FindByIdentityIdAsync(string identityId, CancellationToken ct) =>
        db.Customers.FirstOrDefaultAsync(c => c.IdentityId == identityId, ct);

    public void Add(Customer customer) => db.Customers.Add(customer);
}

/// <summary>
/// Stoktan koşullu düşme: "quantity >= istenen" ise tek UPDATE ile düşer. Aynı anda gelen iki
/// sipariş satır kilidi yüzünden sırayla işlenir; ikincisi yetersiz stokta 0 satır günceller.
/// </summary>
internal sealed class StockReservation(AppDbContext db) : IStockReservation
{
    private const string Sql =
        $"UPDATE {Schemas.Inventory}.stock_items SET quantity = quantity - {{0}}, updated_at = {{1}} " +
        "WHERE product_id = {2} AND quantity >= {0}";

    public async Task<IReadOnlyList<StockShortage>> TryReserveAsync(
        IReadOnlyDictionary<string, int> quantities, DateTimeOffset now, CancellationToken ct)
    {
        var ids = quantities.Keys.ToList();
        // Stok kaydı olmayan ürünler (ör. admin panelinden yeni eklenen) takip edilmez → atlanır
        var tracked = await db.StockItems.AsNoTracking()
            .Where(s => ids.Contains(s.ProductId))
            .Select(s => s.ProductId)
            .ToListAsync(ct);

        var shortages = new List<StockShortage>();
        // Kilitlenme (deadlock) olmasın diye her zaman aynı sırayla
        foreach (var id in tracked.Order(StringComparer.Ordinal))
        {
            var affected = await db.Database.ExecuteSqlRawAsync(Sql, [quantities[id], now, id], ct);
            if (affected == 0)
            {
                var available = await db.StockItems.AsNoTracking()
                    .Where(s => s.ProductId == id).Select(s => s.Quantity).FirstOrDefaultAsync(ct);
                shortages.Add(new StockShortage(id, available));
            }
        }
        return shortages;
    }

    private const string ReleaseSql =
        $"UPDATE {Schemas.Inventory}.stock_items SET quantity = quantity + {{0}}, updated_at = {{1}} WHERE product_id = {{2}}";

    public async Task ReleaseAsync(IReadOnlyDictionary<string, int> quantities, DateTimeOffset now, CancellationToken ct)
    {
        foreach (var (id, qty) in quantities.OrderBy(kv => kv.Key, StringComparer.Ordinal))
            await db.Database.ExecuteSqlRawAsync(ReleaseSql, [qty, now, id], ct);
    }
}
