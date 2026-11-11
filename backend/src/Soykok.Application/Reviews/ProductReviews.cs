using Microsoft.Extensions.Logging;
using Soykok.Application.Catalog;
using Soykok.Application.Common.Abstractions;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Application.Ordering.Contracts;
using Soykok.Domain.Customers;
using Soykok.Domain.Reviews;

namespace Soykok.Application.Reviews;

/*
 * Ürün yorumları.
 *   - Yalnızca giriş yapmış üye yazar; bir ürüne bir yorum (tekrar yazarsa mevcut yorumu düzenlenir)
 *   - Yorum admin onayından sonra sitede görünür; düzenlenen yorum yeniden onaya düşer
 *   - Ürünü satın almış (ödenmiş, iptal edilmemiş sipariş) üyenin yorumu "Doğrulanmış alıcı"
 *   - Onay/silme sonrası ürünün ortalama puanı ve yorum sayısı onaylı yorumlardan yeniden hesaplanır
 */

/* ======================= Sözleşmeler ======================= */

public sealed record WriteReviewRequest(int Rating, string? Title, string? Comment);

public sealed record ReviewDto(
    Guid Id, string AuthorName, int Rating, string? Title, string Comment, bool VerifiedPurchase, DateTimeOffset CreatedAt)
{
    public static ReviewDto From(ProductReview r) =>
        new(r.Id, r.AuthorName, r.Rating, r.Title, r.Comment, r.IsVerifiedPurchase, r.ApprovedAt ?? r.CreatedAt);
}

/// <summary>Giriş yapmış üyenin bu ürüne yazdığı yorum (onay bekliyor olabilir)</summary>
public sealed record MyReviewDto(int Rating, string? Title, string Comment, bool IsApproved, bool VerifiedPurchase)
{
    public static MyReviewDto From(ProductReview r) => new(r.Rating, r.Title, r.Comment, r.IsApproved, r.IsVerifiedPurchase);
}

public sealed record ReviewSummary(double Average, int Count, int[] Distribution);

public sealed record ProductReviewsResponse(
    ReviewSummary Summary, int Total, int Page, int PageSize, IReadOnlyList<ReviewDto> Items, MyReviewDto? MyReview);

public sealed record AdminReviewRow(
    Guid Id, string ProductId, string ProductName, string AuthorName, int Rating, string? Title, string Comment,
    bool VerifiedPurchase, bool IsApproved, DateTimeOffset CreatedAt);

public sealed record AdminReviewPage(int Total, int Pending, int Page, int PageSize, IReadOnlyList<AdminReviewRow> Items);

public static class ReviewErrors
{
    public static Error NotFound() => Error.NotFound("reviews.not_found", "Yorum bulunamadı.");
}

/* ======================= Site ======================= */

public sealed record GetProductReviewsQuery(string ProductId, int Page, int PageSize, string? IdentityId);
public sealed record WriteReviewCommand(string ProductId, WriteReviewRequest Request, CurrentUser User);

public sealed class ProductReviewsHandler(
    IReviewRepository reviews,
    IProductRepository products,
    ICustomerRepository customers,
    IOrderRepository orders,
    IUnitOfWork unitOfWork,
    TimeProvider clock,
    ILogger<ProductReviewsHandler> log)
    : IQueryHandler<GetProductReviewsQuery, Result<ProductReviewsResponse>>,
      ICommandHandler<WriteReviewCommand, Result<MyReviewDto>>
{
    public const int MinComment = 10;

    public async Task<Result<ProductReviewsResponse>> HandleAsync(GetProductReviewsQuery query, CancellationToken ct)
    {
        if (!await products.ExistsAsync(query.ProductId, ct)) return CatalogErrors.ProductNotFound(query.ProductId);

        var page = Math.Max(query.Page, 1);
        var size = Math.Clamp(query.PageSize, 1, 50);
        var (total, items) = await reviews.ListApprovedAsync(query.ProductId, page, size, ct);
        var stats = await reviews.GetApprovedStatsAsync(query.ProductId, ct);

        MyReviewDto? mine = null;
        if (query.IdentityId is { } identity && await customers.FindByIdentityIdAsync(identity, ct) is { } customer)
            mine = await reviews.FindAsync(query.ProductId, customer.Id, ct) is { } r ? MyReviewDto.From(r) : null;

        return new ProductReviewsResponse(
            new ReviewSummary(stats.Average, stats.Count, stats.Distribution), total, page, size,
            items.Select(ReviewDto.From).ToList(), mine);
    }

    public async Task<Result<MyReviewDto>> HandleAsync(WriteReviewCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var errors = new Dictionary<string, string[]>();
        var title = r.Title?.Trim();
        var comment = r.Comment?.Trim() ?? "";
        if (r.Rating is < ProductReview.MinRating or > ProductReview.MaxRating) errors["rating"] = ["1 ile 5 arasında puan verin."];
        if (title is { Length: > 150 }) errors["title"] = ["Başlık en fazla 150 karakter olabilir."];
        if (comment.Length < MinComment) errors["comment"] = [$"Yorumunuz en az {MinComment} karakter olmalı."];
        else if (comment.Length > 2000) errors["comment"] = ["Yorum en fazla 2000 karakter olabilir."];
        if (errors.Count > 0) return Error.Validation(errors);

        if (!await products.ExistsAsync(command.ProductId, ct)) return CatalogErrors.ProductNotFound(command.ProductId);

        var now = clock.GetUtcNow();
        var user = command.User;
        var customer = await customers.FindByIdentityIdAsync(user.IdentityId, ct);
        if (customer is null)
        {
            var email = string.IsNullOrWhiteSpace(user.Email) ? $"{user.IdentityId}@uye.local" : user.Email;
            var first = string.IsNullOrWhiteSpace(user.FirstName) ? email.Split('@')[0] : user.FirstName;
            customer = Customer.Create(user.IdentityId, email, first, user.LastName, now);
            customers.Add(customer);
        }

        var author = AuthorName(customer.FirstName, customer.LastName);
        var verified = await orders.HasPurchasedAsync(customer.Id, command.ProductId, ct);

        var review = await reviews.FindAsync(command.ProductId, customer.Id, ct);
        if (review is null)
        {
            review = ProductReview.Create(command.ProductId, customer.Id, author, r.Rating, title, comment, verified, now);
            reviews.Add(review);
        }
        else
        {
            review.Edit(author, r.Rating, title, comment, verified, now);
        }

        await unitOfWork.SaveChangesAsync(ct);
        log.LogInformation("Ürün yorumu onaya düştü: {ProductId} ({Rating}★)", command.ProductId, r.Rating);
        return MyReviewDto.From(review);
    }

    /// <summary>"Ayşe Kaya" → "Ayşe K." (soyad gizlenir)</summary>
    private static string AuthorName(string first, string last)
    {
        var f = first.Trim();
        var l = last.Trim();
        return l.Length > 0 ? $"{f} {char.ToUpper(l[0], new System.Globalization.CultureInfo("tr-TR"))}." : f;
    }
}

/* ======================= Admin ======================= */

public sealed record ListReviewsQuery(string? Status, int Page = 1, int PageSize = 20);
public sealed record ApproveReviewCommand(Guid Id);
public sealed record DeleteReviewCommand(Guid Id);

public sealed class ReviewsAdminHandler(
    IReviewRepository reviews,
    IProductRepository products,
    IUnitOfWork unitOfWork,
    CatalogSnapshotProvider catalog,
    TimeProvider clock)
    : IQueryHandler<ListReviewsQuery, AdminReviewPage>,
      ICommandHandler<ApproveReviewCommand, Result>,
      ICommandHandler<DeleteReviewCommand, Result>
{
    public async Task<AdminReviewPage> HandleAsync(ListReviewsQuery query, CancellationToken ct)
    {
        bool? approved = query.Status switch { "bekleyen" => false, "onayli" => true, _ => null };
        var page = Math.Max(query.Page, 1);
        var size = Math.Clamp(query.PageSize, 1, 100);
        var (total, pending, items) = await reviews.SearchAsync(approved, page, size, ct);
        return new AdminReviewPage(total, pending, page, size, items.Select(x => new AdminReviewRow(
            x.Review.Id, x.Review.ProductId, x.ProductName, x.Review.AuthorName, x.Review.Rating, x.Review.Title,
            x.Review.Comment, x.Review.IsVerifiedPurchase, x.Review.IsApproved, x.Review.CreatedAt)).ToList());
    }

    public async Task<Result> HandleAsync(ApproveReviewCommand command, CancellationToken ct)
    {
        var review = await reviews.GetAsync(command.Id, ct);
        if (review is null) return ReviewErrors.NotFound();
        if (review.IsApproved) return Result.Success();

        review.Approve(clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(ct);
        await RefreshProductAsync(review.ProductId, ct);
        return Result.Success();
    }

    public async Task<Result> HandleAsync(DeleteReviewCommand command, CancellationToken ct)
    {
        var review = await reviews.GetAsync(command.Id, ct);
        if (review is null) return ReviewErrors.NotFound();

        var wasApproved = review.IsApproved;
        reviews.Remove(review);
        await unitOfWork.SaveChangesAsync(ct);
        if (wasApproved) await RefreshProductAsync(review.ProductId, ct);
        return Result.Success();
    }

    /// <summary>Ürünün puanı ve yorum sayısı onaylı yorumlardan (kartlarda ve listede görünen değer)</summary>
    private async Task RefreshProductAsync(string productId, CancellationToken ct)
    {
        var product = await products.GetByIdAsync(productId, ct);
        if (product is null) return;
        var stats = await reviews.GetApprovedStatsAsync(productId, ct);
        product.SetStatistics(stats.Average, stats.Count, product.Sales);
        await unitOfWork.SaveChangesAsync(ct);
        await catalog.InvalidateAsync(ct);
    }
}
