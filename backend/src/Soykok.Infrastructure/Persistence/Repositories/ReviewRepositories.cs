using Microsoft.EntityFrameworkCore;
using Soykok.Application.Common.Abstractions;
using Soykok.Domain.Reviews;

namespace Soykok.Infrastructure.Persistence.Repositories;

internal sealed class ReviewRepository(AppDbContext db) : IReviewRepository
{
    public Task<ProductReview?> GetAsync(Guid id, CancellationToken ct) =>
        db.ProductReviews.FirstOrDefaultAsync(r => r.Id == id, ct);

    public Task<ProductReview?> FindAsync(string productId, Guid customerId, CancellationToken ct) =>
        db.ProductReviews.FirstOrDefaultAsync(r => r.ProductId == productId && r.CustomerId == customerId, ct);

    public void Add(ProductReview review) => db.ProductReviews.Add(review);
    public void Remove(ProductReview review) => db.ProductReviews.Remove(review);

    public async Task<(int Total, IReadOnlyList<ProductReview> Items)> ListApprovedAsync(
        string productId, int page, int pageSize, CancellationToken ct)
    {
        var query = db.ProductReviews.AsNoTracking().Where(r => r.ProductId == productId && r.IsApproved);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(r => r.ApprovedAt).ThenByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (total, items);
    }

    public async Task<ReviewStats> GetApprovedStatsAsync(string productId, CancellationToken ct)
    {
        var rows = await db.ProductReviews.AsNoTracking()
            .Where(r => r.ProductId == productId && r.IsApproved)
            .GroupBy(r => r.Rating)
            .Select(g => new { Rating = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var distribution = new int[ProductReview.MaxRating];
        foreach (var r in rows) distribution[r.Rating - 1] = r.Count;
        var count = distribution.Sum();
        var average = count == 0 ? 0 : Math.Round(rows.Sum(r => r.Rating * r.Count) / (double)count, 1);
        return new ReviewStats(average, count, distribution);
    }

    public async Task<(int Total, int Pending, IReadOnlyList<(ProductReview Review, string ProductName)> Items)> SearchAsync(
        bool? approved, int page, int pageSize, CancellationToken ct)
    {
        var all = db.ProductReviews.AsNoTracking();
        var query = approved is { } a ? all.Where(r => r.IsApproved == a) : all;
        var total = await query.CountAsync(ct);
        var pending = await all.CountAsync(r => !r.IsApproved, ct);
        var rows = await query
            .OrderBy(r => r.IsApproved).ThenByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Join(db.Products, r => r.ProductId, p => p.Id, (r, p) => new { Review = r, p.Name })
            .ToListAsync(ct);
        return (total, pending, rows.Select(x => (x.Review, x.Name)).ToList());
    }
}
