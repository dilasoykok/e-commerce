using Soykok.Domain.Ordering;

namespace Soykok.Application.Common.Abstractions;

/// <summary>
/// Kartla ödeme kuruluşu (iyzico). Kart bilgisi sitemize hiç gelmez: müşteri kuruluşun
/// 3D Secure ödeme sayfasına yönlendirilir, ödeme bitince tarayıcı geri dönüş adresimize gelir.
/// </summary>
public interface IPaymentGateway
{
    /// <summary>Anahtarlar tanımlı değilse false: kartla ödeme kapalıdır.</summary>
    bool IsEnabled { get; }

    /// <summary>Sipariş için ödeme sayfası açar.</summary>
    Task<PaymentSession> StartCheckoutAsync(Order order, string clientIp, CancellationToken ct);

    /// <summary>Geri dönüşteki token ile ödemenin sonucunu kuruluştan sorar (tarayıcıya güvenilmez).</summary>
    Task<PaymentOutcome> GetCheckoutResultAsync(string token, string orderNumber, CancellationToken ct);
}

public sealed record PaymentSession(bool Success, string? PaymentPageUrl, string? ErrorMessage);

/// <param name="OrderNumber">Kuruluşun döndürdüğü sepet numarası (= sipariş numarası)</param>
public sealed record PaymentOutcome(
    bool Success, string? OrderNumber, string? PaymentId, decimal PaidPrice, string? ErrorMessage);
