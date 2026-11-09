namespace Soykok.Domain.Ordering;

/// <summary>Sipariş durum geçmişi satırı (takip ekranındaki adımlar).</summary>
public sealed class OrderStatusChange
{
    private OrderStatusChange() { } // EF Core

    internal OrderStatusChange(Guid orderId, OrderStatus status, string? note, DateTimeOffset now)
    {
        Id = Guid.CreateVersion7(now);
        OrderId = orderId;
        Status = status;
        Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        ChangedAt = now;
    }

    public Guid Id { get; private set; }
    public Guid OrderId { get; private set; }
    public OrderStatus Status { get; private set; }
    public string? Note { get; private set; }
    public DateTimeOffset ChangedAt { get; private set; }
}
