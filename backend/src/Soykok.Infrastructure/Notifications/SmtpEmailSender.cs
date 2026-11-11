using System.Net;
using System.Net.Mail;
using System.Text;
using Microsoft.Extensions.Options;

namespace Soykok.Infrastructure.Notifications;

/// <param name="ReplyTo">Yanıtla denince gidilecek adres (ör. iletişim formunu dolduran müşteri)</param>
public sealed record EmailMessage(string To, string Subject, string Html, string? ReplyTo = null);

/// <summary>SMTP ile e-posta gönderir (ek paket gerektirmez).</summary>
public sealed class SmtpEmailSender(IOptions<EmailOptions> options)
{
    private readonly EmailOptions _o = options.Value;

    public bool IsEnabled => _o.IsConfigured;

    public async Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        using var client = new SmtpClient(_o.Host, _o.Port)
        {
            EnableSsl = _o.UseSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            Timeout = 30_000,
            Credentials = string.IsNullOrWhiteSpace(_o.Username) ? null : new NetworkCredential(_o.Username, _o.Password),
        };

        using var mail = new MailMessage
        {
            From = new MailAddress(_o.From!, _o.FromName, Encoding.UTF8),
            Subject = message.Subject,
            SubjectEncoding = Encoding.UTF8,
            Body = message.Html,
            BodyEncoding = Encoding.UTF8,
            IsBodyHtml = true,
        };
        mail.To.Add(message.To);
        if (!string.IsNullOrWhiteSpace(message.ReplyTo)) mail.ReplyToList.Add(message.ReplyTo);

        await client.SendMailAsync(mail, ct);
    }
}
