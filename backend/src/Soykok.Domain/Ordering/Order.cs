using Soykok.Domain.Common;

namespace Soykok.Domain.Ordering;

/// <summary>Sipariş anındaki alıcı bilgisi (üye bilgileri sonradan değişse de sipariş bozulmaz).</summary>
public sealed record BuyerInfo
{
    private BuyerInfo() { } // EF Core

    public BuyerInfo(string email, string firstName, string lastName, string phone)
    {
        Email = Guard.NotEmpty(email, "E-posta").ToLowerInvariant();
        FirstName = Guard.NotEmpty(firstName, "Ad");
        LastName = Guard.NotEmpty(lastName, "Soyad");
        Phone = Guard.NotEmpty(phone, "Telefon");
    }

    public string Email { get; private init; } = null!;
    public string FirstName { get; private init; } = null!;
    public string LastName { get; private init; } = null!;
    public string Phone { get; private init; } = null!;
}

/// <summary>Siparişe girecek ürün satırı (fiyat sunucuda katalogdan alınır).</summary>
public sealed record OrderLine(
    string ProductId, string ProductName, string Brand, string Image, string? Unit, decimal UnitPrice, int Quantity);

public sealed class Order
{
    private static readonly Dictionary<OrderStatus, OrderStatus[]> AllowedTransitions = new()
    {
        [OrderStatus.AwaitingPayment] = [OrderStatus.Received, OrderStatus.Cancelled],
        [OrderStatus.Received] = [OrderStatus.Preparing, OrderStatus.Cancelled],
        [OrderStatus.Preparing] = [OrderStatus.Shipped, OrderStatus.Cancelled],
        [OrderStatus.Shipped] = [OrderStatus.Delivered],
        [OrderStatus.Delivered] = [],
        [OrderStatus.Cancelled] = [],
    };

    private readonly List<OrderItem> _items = [];
    private readonly List<OrderStatusChange> _statusHistory = [];

    private Order() { } // EF Core

    public Guid Id { get; private set; }
    /// <summary>Müşteriye gösterilen numara: SYK-261109-4821</summary>
    public string Number { get; private set; } = null!;
    /// <summary>Üye siparişi ise müşteri; misafir siparişinde boş.</summary>
    public Guid? CustomerId { get; private set; }
    public BuyerInfo Buyer { get; private set; } = null!;

    public DeliveryMethod DeliveryMethod { get; private set; }
    /// <summary>Kargo ile teslimde zorunlu; mağazadan teslimde boş.</summary>
    public PostalAddress? ShippingAddress { get; private set; }
    public string? DeliveryNote { get; private set; }
    public InvoiceInfo Invoice { get; private set; } = null!;

    public PaymentMethod PaymentMethod { get; private set; }
    public OrderStatus Status { get; private set; }

    /// <summary>Şu anki durumdan geçilebilecek durumlar (admin ekranındaki butonlar).</summary>
    public IReadOnlyCollection<OrderStatus> NextStatuses => AllowedTransitions[Status];

    public decimal Subtotal { get; private set; }
    public decimal ShippingFee { get; private set; }
    public decimal Total { get; private set; }

    public bool MarketingConsent { get; private set; }
    public DateTimeOffset PlacedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public IReadOnlyCollection<OrderItem> Items => _items;
    public IReadOnlyCollection<OrderStatusChange> StatusHistory => _statusHistory;

    public static Order Place(
        string number,
        Guid? customerId,
        BuyerInfo buyer,
        DeliveryMethod deliveryMethod,
        PostalAddress? shippingAddress,
        string? deliveryNote,
        InvoiceInfo invoice,
        PaymentMethod paymentMethod,
        bool marketingConsent,
        IReadOnlyCollection<OrderLine> lines,
        decimal shippingFee,
        DateTimeOffset now)
    {
        if (lines.Count == 0)
            throw new DomainException("Sipariş en az bir ürün içermeli.");
        if (deliveryMethod == DeliveryMethod.Cargo && shippingAddress is null)
            throw new DomainException("Kargo ile teslimat için adres gerekli.");
        if (shippingFee < 0)
            throw new DomainException("Kargo ücreti negatif olamaz.");

        var order = new Order
        {
            Id = Guid.CreateVersion7(now),
            Number = Guard.NotEmpty(number, "Sipariş numarası"),
            CustomerId = customerId,
            Buyer = buyer,
            DeliveryMethod = deliveryMethod,
            ShippingAddress = deliveryMethod == DeliveryMethod.Cargo ? shippingAddress : null,
            DeliveryNote = Guard.TrimToNull(deliveryNote),
            Invoice = invoice,
            PaymentMethod = paymentMethod,
            MarketingConsent = marketingConsent,
            PlacedAt = now,
            UpdatedAt = now,
        };

        foreach (var line in lines)
            order._items.Add(new OrderItem(order.Id, line, now));

        order.Subtotal = order._items.Sum(i => i.LineTotal);
        order.ShippingFee = deliveryMethod == DeliveryMethod.Store ? 0 : shippingFee;
        order.Total = order.Subtotal + order.ShippingFee;

        // Havalede para gelince, kartta ödeme kuruluşu onaylayınca "received" olur
        order.SetStatus(OrderStatus.AwaitingPayment, null, now);
        return order;
    }

    public void ChangeStatus(OrderStatus next, string? note, DateTimeOffset now)
    {
        if (!AllowedTransitions[Status].Contains(next))
            throw new DomainException($"Sipariş durumu {Status} → {next} olarak değiştirilemez.");
        SetStatus(next, note, now);
    }

    private void SetStatus(OrderStatus status, string? note, DateTimeOffset now)
    {
        Status = status;
        UpdatedAt = now;
        _statusHistory.Add(new OrderStatusChange(Id, status, note, now));
    }
}
