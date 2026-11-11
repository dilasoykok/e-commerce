using Soykok.Domain.Reviews;

namespace Soykok.Application.Common.Abstractions;

public sealed record ReviewStats(double Average, int Count, int[] Distribution);

public interface IReviewRepository
{
    Task<ProductReview?> GetAsync(Guid id, CancellationToken ct);
    Task<ProductReview?> FindAsync(string productId, Guid customerId, CancellationToken ct);
    void Add(ProductReview review);
    void Remove(ProductReview review);

    /// <summary>Ürünün onaylı yorumları, en yeni önce</summary>
    Task<(int Total, IReadOnlyList<ProductReview> Items)> ListApprovedAsync(string productId, int page, int pageSize, CancellationToken ct);

    /// <summary>Onaylı yorumların ortalaması, sayısı ve 1–5 yıldız dağılımı (Distribution[0] = 1 yıldız)</summary>
    Task<ReviewStats> GetApprovedStatsAsync(string productId, CancellationToken ct);

    /// <summary>Admin listesi: approved null → hepsi. Pending: onay bekleyen sayısı (sekme rozeti)</summary>
    Task<(int Total, int Pending, IReadOnlyList<(ProductReview Review, string ProductName)> Items)> SearchAsync(
        bool? approved, int page, int pageSize, CancellationToken ct);
}
