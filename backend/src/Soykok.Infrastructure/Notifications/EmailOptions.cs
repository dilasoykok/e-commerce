namespace Soykok.Infrastructure.Notifications;

/// <summary>
/// E-posta (SMTP) ayarları — appsettings "Email"; docker'da .env'deki SMTP_* değişkenleri.
/// Gmail, şirket e-postası, Brevo, Resend vb. SMTP veren her servisle çalışır (587 / STARTTLS).
/// Host ya da From boşsa e-posta gönderilmez (site çalışmaya devam eder).
/// </summary>
public sealed class EmailOptions
{
    public const string Section = "Email";

    public string? Host { get; set; }
    /// <summary>587 (STARTTLS) önerilir. Not: System.Net.Mail 465 (doğrudan SSL) portunu desteklemez.</summary>
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string? Username { get; set; }
    public string? Password { get; set; }

    /// <summary>Gönderen adres, ör. siparis@soykok.com</summary>
    public string? From { get; set; }
    public string FromName { get; set; } = "Soykök Ticaret";

    /// <summary>Yeni sipariş bildiriminin gideceği adres (boşsa admin'e mail gitmez)</summary>
    public string? AdminAddress { get; set; }

    /// <summary>Maildeki bağlantılar için sitenin adresi (PUBLIC_URL)</summary>
    public string SiteUrl { get; set; } = "http://localhost";

    /// <summary>Havale bilgisi (isteğe bağlı; boşsa mailde sipariş sayfasına bağlantı verilir)</summary>
    public string? BankName { get; set; }
    public string? AccountHolder { get; set; }
    public string? Iban { get; set; }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Host) && !string.IsNullOrWhiteSpace(From);
}
