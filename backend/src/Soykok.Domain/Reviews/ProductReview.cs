using Soykok.Domain.Common;

namespace Soykok.Domain.Reviews;

/// <summary>Ürün yorumu. Yönetici onaylayınca sitede görünür. Bir müşteri bir ürüne bir yorum yazabilir.</summary>
public sealed class ProductReview
{
    public const int MinRating = 1;
    public const int MaxRating = 5;

    private ProductReview() { } // EF Core

    public Guid Id { get; private set; }
    public string ProductId { get; private set; } = null!;
    public Guid CustomerId { get; private set; }
    /// <summary>Sitede görünen ad ("Ayşe K.").</summary>
    public string AuthorName { get; private set; } = null!;
    public int Rating { get; private set; }
    public string? Title { get; private set; }
    public string Comment { get; private set; } = null!;
    public bool IsApproved { get; private set; }
    /// <summary>Yazan üye bu ürünü satın almış (ödenmiş, iptal edilmemiş sipariş)</summary>
    public bool IsVerifiedPurchase { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset? ApprovedAt { get; private set; }

    public static ProductReview Create(
        string productId, Guid customerId, string authorName, int rating, string? title, string comment,
        bool verifiedPurchase, DateTimeOffset now)
    {
        CheckRating(rating);
        return new ProductReview
        {
            Id = Guid.CreateVersion7(now),
            ProductId = Guard.NotEmpty(productId, "Ürün"),
            CustomerId = customerId,
            AuthorName = Guard.NotEmpty(authorName, "Ad"),
            Rating = rating,
            Title = Guard.TrimToNull(title),
            Comment = Guard.NotEmpty(comment, "Yorum"),
            IsVerifiedPurchase = verifiedPurchase,
            CreatedAt = now,
        };
    }

    /// <summary>Üye yorumunu düzenler; yorum yeniden onaya düşer.</summary>
    public void Edit(string authorName, int rating, string? title, string comment, bool verifiedPurchase, DateTimeOffset now)
    {
        CheckRating(rating);
        AuthorName = Guard.NotEmpty(authorName, "Ad");
        Rating = rating;
        Title = Guard.TrimToNull(title);
        Comment = Guard.NotEmpty(comment, "Yorum");
        IsVerifiedPurchase = IsVerifiedPurchase || verifiedPurchase;
        IsApproved = false;
        ApprovedAt = null;
        CreatedAt = now;
    }

    private static void CheckRating(int rating)
    {
        if (rating is < MinRating or > MaxRating)
            throw new DomainException($"Puan {MinRating} ile {MaxRating} arasında olmalı.");
    }

    public void Approve(DateTimeOffset now)
    {
        IsApproved = true;
        ApprovedAt = now;
    }
}
