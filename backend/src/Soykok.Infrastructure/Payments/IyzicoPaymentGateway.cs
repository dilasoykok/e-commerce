using System.Globalization;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Soykok.Application.Common.Abstractions;
using Soykok.Domain.Common;
using Soykok.Domain.Ordering;

namespace Soykok.Infrastructure.Payments;

/// <summary>
/// iyzico Ortak Ödeme Sayfası (Checkout Form) — resmi SDK yerine doğrudan REST (iki uç nokta yeterli).
///   Başlat:  POST /payment/iyzipos/checkoutform/initialize/auth/ecom  → paymentPageUrl
///   Sonuç:   POST /payment/iyzipos/checkoutform/auth/ecom/detail       → paymentStatus
/// Kimlik doğrulama IYZWSv2: HMACSHA256(randomKey + yol + gövde, secretKey).
/// Dokümantasyon: https://docs.iyzico.com
/// </summary>
public sealed class IyzicoPaymentGateway(
    HttpClient http,
    IOptions<IyzicoOptions> options,
    ILogger<IyzicoPaymentGateway> log) : IPaymentGateway
{
    private const string InitializePath = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
    private const string RetrievePath = "/payment/iyzipos/checkoutform/auth/ecom/detail";

    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly IyzicoOptions _o = options.Value;

    public bool IsEnabled => _o.IsConfigured;

    public async Task<PaymentSession> StartCheckoutAsync(Order order, string clientIp, CancellationToken ct)
    {
        var buyerName = $"{order.Buyer.FirstName} {order.Buyer.LastName}";
        // Mağazadan teslimde kargo adresi yok; iyzico fiziksel üründe adres istediği için mağaza bilgisi gider
        var address = order.ShippingAddress;
        var city = address?.City ?? "Karabük";
        var line = address is null ? "Mağazadan teslim alınacak (Safranbolu)" : $"{address.Line} {address.District}/{address.City}";
        var addressDto = new { contactName = buyerName, city, country = "Turkey", address = line, zipCode = address?.PostalCode };

        var items = order.Items
            .Select(i => new
            {
                id = i.ProductId,
                name = Truncate(i.ProductName, 200),
                category1 = string.IsNullOrWhiteSpace(i.Brand) ? "Ürün" : i.Brand,
                itemType = "PHYSICAL",
                price = Money(i.LineTotal),
            })
            .ToList();
        if (order.ShippingFee > 0)
            items.Add(new { id = "KARGO", name = "Kargo Ücreti", category1 = "Kargo", itemType = "PHYSICAL", price = Money(order.ShippingFee) });

        var request = new
        {
            locale = "tr",
            conversationId = order.Number,
            price = Money(items.Sum(i => decimal.Parse(i.price, CultureInfo.InvariantCulture))),
            paidPrice = Money(order.Total),
            currency = "TRY",
            basketId = order.Number,
            paymentGroup = "PRODUCT",
            callbackUrl = CallbackFor(order.Number),
            enabledInstallments = _o.EnabledInstallments is { Length: > 0 } inst ? inst : null,
            buyer = new
            {
                id = order.CustomerId?.ToString() ?? $"misafir-{order.Number}",
                name = order.Buyer.FirstName,
                surname = order.Buyer.LastName,
                gsmNumber = "+9" + order.Buyer.Phone, // 05321234567 → +905321234567
                email = order.Buyer.Email,
                identityNumber = IdentityNumberFor(order.Invoice),
                registrationAddress = line,
                ip = clientIp,
                city,
                country = "Turkey",
                zipCode = address?.PostalCode,
            },
            shippingAddress = addressDto,
            billingAddress = addressDto,
            basketItems = items,
        };

        using var doc = await PostAsync(InitializePath, request, ct);
        var root = doc.RootElement;

        if (Str(root, "status") != "success")
        {
            var error = Str(root, "errorMessage");
            log.LogWarning("iyzico ödeme başlatma reddedildi: {Number} — {Code} {Message}", order.Number, Str(root, "errorCode"), error);
            return new PaymentSession(false, null, error);
        }

        var token = Str(root, "token");
        if (Str(root, "signature") is { } signature && !SignatureMatches(signature, order.Number, token))
            log.LogWarning("iyzico başlatma cevabının imzası tutmadı: {Number}", order.Number);

        var url = Str(root, "paymentPageUrl");
        return url is null
            ? new PaymentSession(false, null, "Ödeme sayfası adresi alınamadı")
            : new PaymentSession(true, url, null, token);
    }

    public async Task<PaymentOutcome> GetCheckoutResultAsync(string token, string orderNumber, CancellationToken ct)
    {
        using var doc = await PostAsync(RetrievePath, new { locale = "tr", conversationId = orderNumber, token }, ct);
        var root = doc.RootElement;

        var basketId = Str(root, "basketId");
        if (Str(root, "status") != "success")
            return new PaymentOutcome(false, basketId, null, 0, Str(root, "errorMessage") ?? "Ödeme sorgulanamadı.");

        var paymentStatus = Str(root, "paymentStatus");
        var paymentId = Str(root, "paymentId");
        var paidPrice = Dec(root, "paidPrice");

        // Cevap gerçekten iyzico'dan mı ve değiştirilmemiş mi?
        if (Str(root, "signature") is { } signature)
        {
            var ok = SignatureMatches(signature,
                paymentStatus, paymentId, Str(root, "currency"), basketId, Str(root, "conversationId"),
                Money(paidPrice), Money(Dec(root, "price")), Str(root, "token"));
            if (!ok)
            {
                log.LogError("iyzico ödeme sonucunun imzası tutmadı: {Number}", orderNumber);
                return new PaymentOutcome(false, basketId, paymentId, 0, "Ödeme sonucu doğrulanamadı.");
            }
        }
        else
        {
            log.LogWarning("iyzico ödeme sonucunda imza yok: {Number}", orderNumber);
        }

        // fraudStatus: 1 onaylı, 0 incelemede, -1 reddedildi
        var fraud = root.TryGetProperty("fraudStatus", out var f) && f.ValueKind == JsonValueKind.Number ? f.GetInt32() : 1;
        if (paymentStatus == "SUCCESS" && fraud != -1)
        {
            if (fraud == 0) log.LogWarning("iyzico ödemesi fraud incelemesinde: {Number} ({PaymentId})", orderNumber, paymentId);
            return new PaymentOutcome(true, basketId, paymentId, paidPrice, null);
        }

        return new PaymentOutcome(false, basketId, paymentId, 0,
            Str(root, "errorMessage") ?? (fraud == -1 ? "Ödeme güvenlik kontrolünden geçemedi." : "Ödeme tamamlanamadı."));
    }

    /* ---------- HTTP + IYZWSv2 ---------- */

    private async Task<JsonDocument> PostAsync(string path, object body, CancellationToken ct)
    {
        var json = JsonSerializer.Serialize(body, Json);
        var randomKey = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{RandomNumberGenerator.GetHexString(8, lowercase: true)}";
        var signature = Hmac(randomKey + path + json);
        var auth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"apiKey:{_o.ApiKey}&randomKey:{randomKey}&signature:{signature}"));

        using var request = new HttpRequestMessage(HttpMethod.Post, _o.BaseUrl.TrimEnd('/') + path)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json"),
        };
        request.Headers.TryAddWithoutValidation("Authorization", "IYZWSv2 " + auth);
        request.Headers.TryAddWithoutValidation("x-iyzi-rnd", randomKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        using var response = await http.SendAsync(request, ct);
        var text = await response.Content.ReadAsStringAsync(ct);
        if (string.IsNullOrWhiteSpace(text))
            throw new HttpRequestException($"iyzico boş cevap döndü ({(int)response.StatusCode}).");
        return JsonDocument.Parse(text);
    }

    private string Hmac(string data) =>
        Convert.ToHexStringLower(HMACSHA256.HashData(Encoding.UTF8.GetBytes(_o.SecretKey!), Encoding.UTF8.GetBytes(data)));

    private bool SignatureMatches(string signature, params string?[] parts) =>
        CryptographicOperations.FixedTimeEquals(
            Encoding.ASCII.GetBytes(Hmac(string.Join(':', parts.Select(p => p ?? "")))),
            Encoding.ASCII.GetBytes(signature.ToLowerInvariant()));

    /* ---------- Yardımcılar ---------- */

    private string CallbackFor(string number)
    {
        var url = _o.CallbackUrl!;
        return url + (url.Contains('?') ? '&' : '?') + "no=" + Uri.EscapeDataString(number);
    }

    private string IdentityNumberFor(InvoiceInfo invoice) =>
        invoice.Type == InvoiceType.Corporate && invoice.TaxNumber is { Length: 11 } tckn ? tckn : _o.DefaultIdentityNumber;

    /// <summary>iyzico biçimi: nokta ayraç, sondaki sıfırlar atılır (149.00 → "149", 10.50 → "10.5")</summary>
    private static string Money(decimal value) => value.ToString("0.########", CultureInfo.InvariantCulture);

    private static string? Str(JsonElement e, string name) =>
        e.TryGetProperty(name, out var v) && v.ValueKind is JsonValueKind.String or JsonValueKind.Number
            ? (v.ValueKind == JsonValueKind.String ? v.GetString() : v.GetRawText())
            : null;

    private static decimal Dec(JsonElement e, string name) =>
        e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.Number ? v.GetDecimal()
        : e.TryGetProperty(name, out v) && v.ValueKind == JsonValueKind.String &&
          decimal.TryParse(v.GetString(), NumberStyles.Number, CultureInfo.InvariantCulture, out var d) ? d
        : 0m;

    private static string Truncate(string s, int max) => s.Length <= max ? s : s[..max];
}
