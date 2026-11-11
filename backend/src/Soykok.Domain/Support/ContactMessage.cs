using Soykok.Domain.Common;

namespace Soykok.Domain.Support;

/// <summary>Sitedeki iletişim formundan gelen mesaj. Admin panelinde "Mesajlar" sekmesinde okunur.</summary>
public sealed class ContactMessage
{
    public const int MaxMessageLength = 2000;

    private ContactMessage() { } // EF Core

    public Guid Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public string? Phone { get; private set; }
    /// <summary>Konu kodu: urun, siparis, iade, numune, proje, diger</summary>
    public string Subject { get; private set; } = null!;
    public string? OrderNumber { get; private set; }
    public string Message { get; private set; } = null!;
    public string? IpAddress { get; private set; }
    public bool IsRead { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset? ReadAt { get; private set; }

    public static ContactMessage Create(
        string name, string email, string? phone, string subject, string? orderNumber, string message,
        string? ipAddress, DateTimeOffset now) => new()
    {
        Id = Guid.CreateVersion7(now),
        Name = Guard.NotEmpty(name, "Ad"),
        Email = Guard.NotEmpty(email, "E-posta").ToLowerInvariant(),
        Phone = Guard.TrimToNull(phone),
        Subject = Guard.NotEmpty(subject, "Konu"),
        OrderNumber = Guard.TrimToNull(orderNumber)?.ToUpperInvariant(),
        Message = Guard.NotEmpty(message, "Mesaj"),
        IpAddress = Guard.TrimToNull(ipAddress),
        CreatedAt = now,
    };

    public void MarkRead(bool read, DateTimeOffset now)
    {
        IsRead = read;
        ReadAt = read ? now : null;
    }
}
