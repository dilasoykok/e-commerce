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

    /// <summary>
    /// Tutar için kart ailelerine göre taksit seçenekleri (Bonus, World, Maximum ...).
    /// Kartla ödeme kapalıysa ya da kuruluşa ulaşılamazsa boş liste.
    /// </summary>
    Task<IReadOnlyList<CardInstallments>> GetInstallmentsAsync(decimal price, CancellationToken ct);
}

/// <param name="Count">Taksit sayısı (1 = tek çekim)</param>
/// <param name="Monthly">Aylık taksit tutarı</param>
/// <param name="Total">Toplam ödenecek (vade farkı dahil)</param>
public sealed record InstallmentPrice(int Count, decimal Monthly, decimal Total);

public sealed record CardInstallments(string CardFamily, string? BankName, IReadOnlyList<InstallmentPrice> Prices);

/// <param name="Token">Ödeme oturumu; siparişe kaydedilir, yarım kalan ödeme sonradan bununla sorgulanır</param>
public sealed record PaymentSession(bool Success, string? PaymentPageUrl, string? ErrorMessage, string? Token = null);

/// <param name="OrderNumber">Kuruluşun döndürdüğü sepet numarası (= sipariş numarası)</param>
public sealed record PaymentOutcome(
    bool Success, string? OrderNumber, string? PaymentId, decimal PaidPrice, string? ErrorMessage);
