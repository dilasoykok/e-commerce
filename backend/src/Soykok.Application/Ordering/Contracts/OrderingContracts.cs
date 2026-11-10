using System.Text.Json;
using Soykok.Domain.Ordering;

namespace Soykok.Application.Ordering.Contracts;

// Alan adları ödeme formundaki (odeme sayfası) input adlarıyla aynı tutuldu;
// doğrulama hataları da bu adlarla döner, arayüz hatayı doğru kutunun altına yazar.

/// <summary>POST /api/orders gövdesi. Fiyat GÖNDERİLMEZ: sunucu katalogdan hesaplar.</summary>
public sealed record PlaceOrderRequest(
    string? Email,
    string? FirstName,
    string? LastName,
    string? Phone,
    string? Delivery,        // "cargo" | "store"
    string? City,
    string? District,
    string? Address,
    string? PostalCode,
    string? Note,
    string? InvoiceType,     // "individual" | "corporate"
    string? CompanyName,
    string? TaxOffice,
    string? TaxNumber,
    string? Payment,         // "card" | "transfer"
    bool Marketing,
    bool Terms,
    IReadOnlyList<OrderItemRequest>? Items);

public sealed record OrderItemRequest(string ProductId, int Quantity);

/// <summary>POST /api/orders/track gövdesi — misafir sipariş takibi.</summary>
public sealed record TrackOrderRequest(string? Number, string? Email);

/// <summary>Siparişi veren kişi (giriş yapmışsa). Api katmanı token/çerezden doldurur.</summary>
public sealed record CurrentUser(string IdentityId, string Email, string FirstName, string LastName);

/* ---------- Cevaplar ---------- */

public sealed record OrderItemDto(
    string ProductId, string ProductName, string Brand, string Image, string? Unit,
    decimal UnitPrice, int Quantity, decimal LineTotal)
{
    public static OrderItemDto From(OrderItem i) =>
        new(i.ProductId, i.ProductName, i.Brand, i.Image, i.Unit, i.UnitPrice, i.Quantity, i.LineTotal);
}

public sealed record StatusChangeDto(string Status, DateTimeOffset ChangedAt, string? Note);

public sealed record ShippingAddressDto(string City, string District, string? Line, string? PostalCode);

/// <summary>Sipariş listesindeki satır (GET /api/me/orders).</summary>
public sealed record OrderSummary(
    string Number, string Status, DateTimeOffset PlacedAt, string DeliveryMethod, string PaymentMethod,
    int ItemCount, decimal Total, IReadOnlyList<OrderItemDto> Items)
{
    public static OrderSummary From(Order o) => new(
        o.Number, OrderingNames.Status(o.Status), o.PlacedAt,
        OrderingNames.Of(o.DeliveryMethod), OrderingNames.Of(o.PaymentMethod),
        o.Items.Count, o.Total,
        o.Items.Select(OrderItemDto.From).ToList());
}

/// <summary>
/// Sipariş detayı. <paramref name="includePersonal"/> false ise (misafir takibi) açık adres
/// satırı ve telefon gibi kişisel bilgiler gönderilmez; yalnızca il/ilçe görünür.
/// </summary>
public sealed record OrderDetail(
    string Number,
    string Status,
    DateTimeOffset PlacedAt,
    string BuyerFirstName,
    string BuyerLastName,
    string BuyerEmail,
    string? BuyerPhone,
    string DeliveryMethod,
    ShippingAddressDto? ShippingAddress,
    string? DeliveryNote,
    string PaymentMethod,
    decimal Subtotal,
    decimal ShippingFee,
    decimal Total,
    IReadOnlyList<OrderItemDto> Items,
    IReadOnlyList<StatusChangeDto> StatusHistory,
    // Yalnızca kartla verilen siparişin cevabında: müşterinin yönlendirileceği 3D Secure ödeme sayfası
    string? PaymentPageUrl = null)
{
    public static OrderDetail From(Order o, bool includePersonal) => new(
        o.Number,
        OrderingNames.Status(o.Status),
        o.PlacedAt,
        o.Buyer.FirstName,
        includePersonal ? o.Buyer.LastName : Mask(o.Buyer.LastName),
        includePersonal ? o.Buyer.Email : MaskEmail(o.Buyer.Email),
        includePersonal ? o.Buyer.Phone : null,
        OrderingNames.Of(o.DeliveryMethod),
        o.ShippingAddress is { } a
            ? new ShippingAddressDto(a.City, a.District, includePersonal ? a.Line : null, includePersonal ? a.PostalCode : null)
            : null,
        includePersonal ? o.DeliveryNote : null,
        OrderingNames.Of(o.PaymentMethod),
        o.Subtotal,
        o.ShippingFee,
        o.Total,
        o.Items.Select(OrderItemDto.From).ToList(),
        o.StatusHistory.OrderBy(h => h.ChangedAt)
            .Select(h => new StatusChangeDto(OrderingNames.Status(h.Status), h.ChangedAt, h.Note)).ToList());

    private static string Mask(string s) => s.Length <= 1 ? s : s[0] + new string('*', Math.Min(s.Length - 1, 5));

    private static string MaskEmail(string email)
    {
        var at = email.IndexOf('@');
        return at <= 1 ? email : email[0] + new string('*', Math.Min(at - 1, 5)) + email[at..];
    }
}

/// <summary>RabbitMQ'ya giden olay: order.created</summary>
public sealed record OrderCreatedEvent(
    Guid OrderId, string Number, Guid? CustomerId, string Email, decimal Total,
    string PaymentMethod, string DeliveryMethod, IReadOnlyList<OrderItemDto> Items, DateTimeOffset PlacedAt);

public static class OrderingEvents
{
    public const string OrderCreated = "order.created";
}

/// <summary>Enum ↔ API'deki metin karşılığı (camelCase): AwaitingPayment → "awaitingPayment"</summary>
public static class OrderingNames
{
    public static string Status(OrderStatus s) => JsonNamingPolicy.CamelCase.ConvertName(s.ToString());
    public static string Of(DeliveryMethod d) => d == DeliveryMethod.Store ? "store" : "cargo";
    public static string Of(PaymentMethod p) => p == PaymentMethod.Transfer ? "transfer" : "card";
}
