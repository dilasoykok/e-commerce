using Soykok.Domain.Common;

namespace Soykok.Domain.Inventory;

/// <summary>Ürünün mağaza/depo stoğu.</summary>
public sealed class StockItem
{
    private StockItem() { } // EF Core

    public StockItem(string productId, int quantity, DateTimeOffset now)
    {
        if (quantity < 0) throw new DomainException("Stok negatif olamaz.");
        ProductId = Guard.NotEmpty(productId, "Ürün");
        Quantity = quantity;
        UpdatedAt = now;
    }

    public string ProductId { get; private set; } = null!;
    public int Quantity { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public bool IsInStock => Quantity > 0;

    public void Increase(int amount, DateTimeOffset now)
    {
        if (amount <= 0) throw new DomainException("Eklenecek miktar sıfırdan büyük olmalı.");
        Quantity += amount;
        UpdatedAt = now;
    }

    /// <summary>Admin sayımı: stoğu verilen adede eşitler.</summary>
    public void Set(int quantity, DateTimeOffset now)
    {
        if (quantity < 0) throw new DomainException("Stok negatif olamaz.");
        Quantity = quantity;
        UpdatedAt = now;
    }

    /// <summary>Sipariş verilince düşülür. Yetersizse DomainException.</summary>
    public void Decrease(int amount, DateTimeOffset now)
    {
        if (amount <= 0) throw new DomainException("Düşülecek miktar sıfırdan büyük olmalı.");
        if (amount > Quantity) throw new DomainException("Yetersiz stok.");
        Quantity -= amount;
        UpdatedAt = now;
    }
}
