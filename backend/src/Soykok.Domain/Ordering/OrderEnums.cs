namespace Soykok.Domain.Ordering;

public enum OrderStatus
{
    /// <summary>Havale/EFT bekleniyor.</summary>
    AwaitingPayment,
    Received,
    Preparing,
    /// <summary>Kargoya verildi (mağazadan teslimde: teslimata hazır).</summary>
    Shipped,
    Delivered,
    Cancelled,
}

public enum DeliveryMethod
{
    /// <summary>Kargo ile adrese teslim.</summary>
    Cargo,
    /// <summary>Mağazadan teslim al.</summary>
    Store,
}

public enum PaymentMethod
{
    Card,
    Transfer,
}
