using Soykok.Domain.Common;

namespace Soykok.Domain.Ordering;

/// <summary>Sipariş satırı. Ürün bilgileri sipariş anındaki haliyle saklanır (ürün sonradan değişse/silinse de).</summary>
public sealed class OrderItem
{
    public const int MaxQuantity = 999;

    private OrderItem() { } // EF Core

    internal OrderItem(Guid orderId, OrderLine line, DateTimeOffset now)
    {
        if (line.Quantity is <= 0 or > MaxQuantity)
            throw new DomainException($"Adet 1 ile {MaxQuantity} arasında olmalı.");
        if (line.UnitPrice <= 0)
            throw new DomainException("Birim fiyat sıfırdan büyük olmalı.");

        Id = Guid.CreateVersion7(now);
        OrderId = orderId;
        ProductId = Guard.NotEmpty(line.ProductId, "Ürün");
        ProductName = Guard.NotEmpty(line.ProductName, "Ürün adı");
        Brand = line.Brand.Trim();
        Image = line.Image.Trim();
        Unit = Guard.TrimToNull(line.Unit);
        UnitPrice = line.UnitPrice;
        Quantity = line.Quantity;
        LineTotal = line.UnitPrice * line.Quantity;
    }

    public Guid Id { get; private set; }
    public Guid OrderId { get; private set; }
    public string ProductId { get; private set; } = null!;
    public string ProductName { get; private set; } = null!;
    public string Brand { get; private set; } = null!;
    public string Image { get; private set; } = null!;
    public string? Unit { get; private set; }
    public decimal UnitPrice { get; private set; }
    public int Quantity { get; private set; }
    public decimal LineTotal { get; private set; }
}
