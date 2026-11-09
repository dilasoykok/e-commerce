namespace Soykok.Domain.Common;

/// <summary>Teslimat/fatura adresi.</summary>
public sealed record PostalAddress
{
    private PostalAddress() { } // EF Core

    public PostalAddress(string city, string district, string line, string? postalCode)
    {
        City = Guard.NotEmpty(city, "İl");
        District = Guard.NotEmpty(district, "İlçe");
        Line = Guard.NotEmpty(line, "Adres");
        PostalCode = Guard.TrimToNull(postalCode);
    }

    public string City { get; private init; } = null!;
    public string District { get; private init; } = null!;
    /// <summary>Mahalle, sokak, bina ve daire bilgisi.</summary>
    public string Line { get; private init; } = null!;
    public string? PostalCode { get; private init; }
}

public enum InvoiceType
{
    Individual,
    Corporate,
}

/// <summary>Fatura bilgisi. Kurumsal faturada firma adı, vergi dairesi ve vergi numarası zorunludur.</summary>
public sealed record InvoiceInfo
{
    private InvoiceInfo() { } // EF Core

    public InvoiceInfo(InvoiceType type, string? companyName = null, string? taxOffice = null, string? taxNumber = null)
    {
        Type = type;
        if (type == InvoiceType.Corporate)
        {
            CompanyName = Guard.NotEmpty(companyName, "Firma adı");
            TaxOffice = Guard.NotEmpty(taxOffice, "Vergi dairesi");
            TaxNumber = Guard.NotEmpty(taxNumber, "Vergi numarası");
        }
    }

    public InvoiceType Type { get; private init; }
    public string? CompanyName { get; private init; }
    public string? TaxOffice { get; private init; }
    public string? TaxNumber { get; private init; }
}
