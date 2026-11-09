namespace Soykok.Domain.Customers;

/// <summary>Müşterinin favorilere eklediği ürün.</summary>
public sealed class FavoriteProduct
{
    private FavoriteProduct() { } // EF Core

    public FavoriteProduct(Guid customerId, string productId, DateTimeOffset now)
    {
        CustomerId = customerId;
        ProductId = productId;
        CreatedAt = now;
    }

    public Guid CustomerId { get; private set; }
    public string ProductId { get; private set; } = null!;
    public DateTimeOffset CreatedAt { get; private set; }
}
