namespace Soykok.Infrastructure.Payments;

/// <summary>
/// iyzico ayarları (appsettings "Iyzico" bölümü; docker'da IYZICO_* ortam değişkenleri).
/// Anahtarlar koda ya da depoya YAZILMAZ: yalnızca .env dosyasında tutulur.
/// </summary>
public sealed class IyzicoOptions
{
    public const string Section = "Iyzico";

    public string? ApiKey { get; set; }
    public string? SecretKey { get; set; }

    /// <summary>Test: https://sandbox-api.iyzipay.com — Canlı: https://api.iyzipay.com</summary>
    public string BaseUrl { get; set; } = "https://sandbox-api.iyzipay.com";

    /// <summary>Ödeme bitince tarayıcının döneceği adres, ör. https://www.soykok.com/api/payments/iyzico/callback</summary>
    public string? CallbackUrl { get; set; }

    /// <summary>Taksit seçenekleri (boşsa iyzico'nun varsayılanı). Ör. [1, 2, 3, 6]</summary>
    public int[]? EnabledInstallments { get; set; }

    /// <summary>
    /// Bireysel faturada T.C. kimlik no istenmediği için iyzico'ya gönderilen değer.
    /// iyzico bu alanı zorunlu tutar; kimlik no toplamayan işyerleri genelde 11111111111 gönderir.
    /// </summary>
    public string DefaultIdentityNumber { get; set; } = "11111111111";

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ApiKey) && !string.IsNullOrWhiteSpace(SecretKey) && !string.IsNullOrWhiteSpace(CallbackUrl);
}
