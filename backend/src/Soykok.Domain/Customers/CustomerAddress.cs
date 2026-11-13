using Soykok.Domain.Common;

namespace Soykok.Domain.Customers;

/// <summary>Müşterinin kayıtlı teslimat adresi (isteğe bağlı fatura bilgisiyle).</summary>
public sealed class CustomerAddress
{
    private CustomerAddress() { } // EF Core

    internal CustomerAddress(
        Guid customerId, string title, string recipientName, string phone, PostalAddress address, InvoiceInfo? invoice,
        DateTimeOffset now)
    {
        Id = Guid.CreateVersion7(now);
        CustomerId = customerId;
        Title = Guard.NotEmpty(title, "Adres başlığı");
        RecipientName = Guard.NotEmpty(recipientName, "Alıcı adı");
        Phone = Guard.NotEmpty(phone, "Telefon");
        Address = address;
        Invoice = invoice;
        CreatedAt = now;
    }

    public Guid Id { get; private set; }
    public Guid CustomerId { get; private set; }
    /// <summary>"Ev", "İş" gibi kısa ad.</summary>
    public string Title { get; private set; } = null!;
    public string RecipientName { get; private set; } = null!;
    public string Phone { get; private set; } = null!;
    public PostalAddress Address { get; private set; } = null!;
    public InvoiceInfo? Invoice { get; private set; }
    public bool IsDefault { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    internal void Update(string title, string recipientName, string phone, PostalAddress address, InvoiceInfo? invoice)
    {
        Title = Guard.NotEmpty(title, "Adres başlığı");
        RecipientName = Guard.NotEmpty(recipientName, "Alıcı adı");
        Phone = Guard.NotEmpty(phone, "Telefon");
        Address = address;
        Invoice = invoice;
    }

    internal void MarkDefault(bool isDefault) => IsDefault = isDefault;
}
