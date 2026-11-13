using Soykok.Domain.Common;

namespace Soykok.Domain.Customers;

/// <summary>
/// Site üyesi. Kimlik (giriş, şifre) Keycloak'ta tutulur; burada yalnızca alışverişle ilgili
/// profil bilgileri vardır. Keycloak kullanıcısıyla <see cref="IdentityId"/> (token'daki "sub") üzerinden eşleşir.
/// </summary>
public sealed class Customer
{
    /// <summary>Bir üyenin kaydedebileceği en fazla adres</summary>
    public const int MaxAddresses = 10;

    private readonly List<CustomerAddress> _addresses = [];

    private Customer() { } // EF Core

    public Guid Id { get; private set; }
    public string IdentityId { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public string FirstName { get; private set; } = null!;
    public string LastName { get; private set; } = null!;
    public string? Phone { get; private set; }
    public bool MarketingConsent { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public IReadOnlyCollection<CustomerAddress> Addresses => _addresses;

    public static Customer Create(string identityId, string email, string firstName, string lastName, DateTimeOffset now) =>
        new()
        {
            Id = Guid.CreateVersion7(now),
            IdentityId = Guard.NotEmpty(identityId, "Kimlik"),
            Email = Guard.NotEmpty(email, "E-posta").ToLowerInvariant(),
            FirstName = Guard.NotEmpty(firstName, "Ad"),
            LastName = lastName.Trim(),
            CreatedAt = now,
            UpdatedAt = now,
        };

    public void UpdateProfile(string firstName, string lastName, string? phone, bool marketingConsent, DateTimeOffset now)
    {
        FirstName = Guard.NotEmpty(firstName, "Ad");
        LastName = lastName.Trim();
        Phone = Guard.TrimToNull(phone);
        MarketingConsent = marketingConsent;
        UpdatedAt = now;
    }

    /// <summary>Keycloak'taki e-posta değişince eşitlemek için.</summary>
    public void SyncEmail(string email, DateTimeOffset now)
    {
        Email = Guard.NotEmpty(email, "E-posta").ToLowerInvariant();
        UpdatedAt = now;
    }

    public CustomerAddress AddAddress(
        string title, string recipientName, string phone, PostalAddress address, InvoiceInfo? invoice, bool makeDefault,
        DateTimeOffset now)
    {
        if (_addresses.Count >= MaxAddresses)
            throw new DomainException($"En fazla {MaxAddresses} adres kaydedebilirsiniz.");

        var item = new CustomerAddress(Id, title, recipientName, phone, address, invoice, now);
        _addresses.Add(item);
        if (makeDefault || _addresses.Count == 1)
            SetDefaultAddress(item.Id);
        UpdatedAt = now;
        return item;
    }

    public void UpdateAddress(
        Guid addressId, string title, string recipientName, string phone, PostalAddress address, InvoiceInfo? invoice,
        bool makeDefault, DateTimeOffset now)
    {
        var item = _addresses.FirstOrDefault(a => a.Id == addressId)
            ?? throw new DomainException("Adres bulunamadı.");
        item.Update(title, recipientName, phone, address, invoice);
        if (makeDefault) SetDefaultAddress(item.Id);
        UpdatedAt = now;
    }

    public void RemoveAddress(Guid addressId, DateTimeOffset now)
    {
        var item = _addresses.FirstOrDefault(a => a.Id == addressId)
            ?? throw new DomainException("Adres bulunamadı.");
        _addresses.Remove(item);
        if (item.IsDefault && _addresses.Count > 0)
            _addresses[0].MarkDefault(true);
        UpdatedAt = now;
    }

    public void SetDefaultAddress(Guid addressId)
    {
        if (_addresses.All(a => a.Id != addressId))
            throw new DomainException("Adres bulunamadı.");
        foreach (var a in _addresses)
            a.MarkDefault(a.Id == addressId);
    }
}
