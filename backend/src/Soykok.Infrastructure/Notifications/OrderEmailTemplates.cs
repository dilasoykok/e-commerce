using System.Globalization;
using System.Net;
using System.Text;
using Soykok.Application.Ordering.Contracts;
using Soykok.Application.Support;
using Soykok.Domain.Ordering;

namespace Soykok.Infrastructure.Notifications;

/// <summary>
/// Sipariş e-postalarının HTML'i. E-posta programları dış CSS desteklemediği için
/// stiller satır içinde; tablo düzeni (Outlook dahil) her yerde düzgün görünür.
/// </summary>
internal static class OrderEmailTemplates
{
    private const string Brand = "#1f2a36";
    private const string Accent = "#8a5726";
    private static readonly CultureInfo Tr = CultureInfo.GetCultureInfo("tr-TR");

    /* ---------- Müşteri ---------- */

    public static EmailMessage TransferReceived(Order o, EmailOptions s) => Customer(o, s,
        $"Siparişiniz alındı — {o.Number}",
        "Siparişiniz alındı",
        $"""
        <p>Siparişiniz için teşekkür ederiz. Siparişiniz <strong>havale/EFT ödemesi</strong> bekliyor.</p>
        <p>Lütfen <strong>{Money(o.Total)}</strong> tutarı 24 saat içinde aşağıdaki hesaba gönderin ve açıklamaya
        sipariş numaranızı (<strong>{E(o.Number)}</strong>) yazın. Ödemeniz bize ulaşınca size haber vereceğiz.</p>
        {BankBox(o, s)}
        """);

    public static EmailMessage PaymentConfirmed(Order o, EmailOptions s, bool card) => Customer(o, s,
        card ? $"Siparişiniz alındı — {o.Number}" : $"Ödemeniz alındı — {o.Number}",
        card ? "Siparişiniz alındı" : "Ödemeniz alındı",
        card
            ? "<p>Siparişiniz için teşekkür ederiz. Kartla ödemeniz onaylandı, siparişiniz hazırlanmak üzere sıraya alındı.</p>"
            : "<p>Havale/EFT ödemeniz bize ulaştı, teşekkür ederiz. Siparişiniz hazırlanmak üzere sıraya alındı.</p>");

    public static EmailMessage Preparing(Order o, EmailOptions s) => Customer(o, s,
        $"Siparişiniz hazırlanıyor — {o.Number}",
        "Siparişiniz hazırlanıyor",
        o.DeliveryMethod == DeliveryMethod.Store
            ? "<p>Siparişiniz hazırlanıyor. Mağazadan teslim almaya hazır olduğunda size tekrar haber vereceğiz.</p>"
            : "<p>Siparişiniz hazırlanıyor. Kargoya verildiğinde takip numarasıyla birlikte size haber vereceğiz.</p>");

    /// <summary>Mağaza adresi ve saatleri (soykok-web/src/lib/store-info.ts ile aynı olmalı)</summary>
    private const string StorePickupBox = """
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f8f7f5;border-radius:6px">
          <tr><td style="padding:14px 16px;font-size:14px;line-height:1.6;color:#1f2a36">
            <strong>Soykök Ticaret — Safranbolu</strong><br>
            Atatürk Mah., Karabük Cad. No:41, 78600 Safranbolu / Karabük<br>
            Pazartesi – Cumartesi 08:00 – 20:00 · Pazar 11:00 – 16:00<br>
            Telefon: <a href="tel:+903707251640" style="color:#1f2a36">0370 725 16 40</a> ·
            <a href="https://www.google.com/maps/dir/?api=1&amp;destination=Soyk%C3%B6k+Ticaret+Safranbolu&amp;destination_place_id=ChIJFTwMxtOqnEARPgeCprU4zpg" style="color:#1f2a36">Yol tarifi</a>
          </td></tr>
        </table>
        """;

    public static EmailMessage Shipped(Order o, EmailOptions s)
    {
        if (o.DeliveryMethod == DeliveryMethod.Store)
            return Customer(o, s, $"Siparişiniz teslim almaya hazır — {o.Number}", "Siparişiniz hazır",
                "<p>Siparişiniz hazır! Safranbolu mağazamızdan çalışma saatleri içinde teslim alabilirsiniz. " +
                "Gelirken sipariş numaranızı yanınızda bulundurun.</p>" + StorePickupBox);

        var shipment = ShipmentDto.From(o);
        var trackLink = shipment?.TrackingUrl is null
            ? ""
            : "<br>" + Link(shipment.TrackingUrl, "Kargo firmasının sitesinde sorgula →");
        var box = shipment is null ? "" : $"""
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#eff6ff;border-radius:6px">
              <tr><td style="padding:14px 16px;font-size:14px;color:#1e3a8a">
                <strong>{E(shipment.CarrierName)}</strong><br>
                Takip numarası: <strong style="font-family:monospace;font-size:15px">{E(shipment.TrackingNumber)}</strong>
                {trackLink}
              </td></tr>
            </table>
            """;
        return Customer(o, s, $"Siparişiniz kargoya verildi — {o.Number}", "Siparişiniz yola çıktı",
            $"<p>Siparişiniz kargoya verildi. Aşağıdaki numarayla kargonuzu takip edebilirsiniz.</p>{box}");
    }

    public static EmailMessage Delivered(Order o, EmailOptions s) => Customer(o, s,
        $"Siparişiniz teslim edildi — {o.Number}",
        "Siparişiniz teslim edildi",
        "<p>Siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz! Ürünlerle ilgili bir sorunuz olursa " +
        "bu e-postayı yanıtlayarak ya da sitemizdeki iletişim sayfasından bize ulaşabilirsiniz.</p>");

    public static EmailMessage Cancelled(Order o, EmailOptions s, string? note) => Customer(o, s,
        $"Siparişiniz iptal edildi — {o.Number}",
        "Siparişiniz iptal edildi",
        $"""
        <p>{E(o.Number)} numaralı siparişiniz iptal edildi.{Reason(note)}</p>
        <p>Ödeme yaptıysanız iade, ödeme yönteminize göre birkaç iş günü içinde hesabınıza yansır.
        Sorunuz olursa bu e-postayı yanıtlayabilirsiniz.</p>
        """);

    /* ---------- Admin ---------- */

    public static EmailMessage NewOrderForAdmin(Order o, EmailOptions s, string to)
    {
        var payment = o.PaymentMethod == PaymentMethod.Card ? "Kartla ödendi" : "Havale bekleniyor";
        var address = o.ShippingAddress is { } a
            ? $"{E(a.Line)}<br>{E(a.District)} / {E(a.City)} {E(a.PostalCode ?? "")}"
            : "Mağazadan teslim";
        var note = o.DeliveryNote is null
            ? ""
            : "<p style=\"background:#fffbeb;padding:8px;border-radius:4px\">Not: " + E(o.DeliveryNote) + "</p>";
        var delivery = o.DeliveryMethod == DeliveryMethod.Store ? "Mağazadan teslim" : "Kargo";
        var body = $"""
            <p><strong>{E(o.Buyer.FirstName)} {E(o.Buyer.LastName)}</strong> · {E(o.Buyer.Email)} · {E(o.Buyer.Phone)}</p>
            <p>{payment} · {delivery}<br>{address}</p>
            {note}
            {Items(o)}
            {Button($"{Site(s)}/admin/siparisler", "Admin panelinde aç")}
            """;
        return new EmailMessage(to, $"Yeni sipariş: {o.Number} — {Money(o.Total)}", Layout("Yeni sipariş", o.Number, body));
    }

    public static EmailMessage ContactForAdmin(ContactReceivedEvent m, EmailOptions s, string to)
    {
        var order = string.IsNullOrWhiteSpace(m.OrderNumber) ? "" : "<br>Sipariş no: <strong>" + E(m.OrderNumber) + "</strong>";
        var phone = string.IsNullOrWhiteSpace(m.Phone) ? "" : " · " + E(m.Phone);
        var text = E(m.Message).Replace("\n", "<br>");
        var body = $"""
            <p><strong>{E(m.Name)}</strong> · {E(m.Email)}{phone}{order}</p>
            <div style="margin:16px 0;padding:14px 16px;background:#f9fafb;border-radius:6px;font-size:14px;line-height:1.6">{text}</div>
            <p style="font-size:12px;color:#6b7280">Bu e-postayı yanıtladığınızda cevabınız doğrudan müşteriye gider.</p>
            {Button($"{Site(s)}/admin/mesajlar", "Admin panelinde aç")}
            """;
        return new EmailMessage(to, $"[İletişim] {m.SubjectLabel} — {m.Name}", Layout("Yeni iletişim mesajı", m.SubjectLabel, body, "Konu"), m.Email);
    }

    /* ---------- Ortak parçalar ---------- */

    private static EmailMessage Customer(Order o, EmailOptions s, string subject, string title, string intro)
    {
        var body = $"""
            <p>Merhaba {E(o.Buyer.FirstName)},</p>
            {intro}
            {Items(o)}
            {Button($"{Site(s)}/siparislerim?no={Uri.EscapeDataString(o.Number)}", "Siparişimi Takip Et")}
            <p style="font-size:12px;color:#6b7280">Üye değilseniz takip sayfasında sipariş numaranızı ve bu e-posta adresini girin.</p>
            """;
        return new EmailMessage(o.Buyer.Email, subject, Layout(title, o.Number, body));
    }

    private static string Items(Order o)
    {
        var rows = new StringBuilder();
        foreach (var i in o.Items)
            rows.Append($"""
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px">{E(i.ProductName)}<br>
                    <span style="color:#6b7280;font-size:12px">{i.Quantity} {E(i.Unit ?? "adet")} × {Money(i.UnitPrice)}</span></td>
                  <td align="right" style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;white-space:nowrap"><strong>{Money(i.LineTotal)}</strong></td>
                </tr>
                """);

        var shipping = o.ShippingFee == 0 ? "Ücretsiz" : Money(o.ShippingFee);
        return $"""
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0">
              {rows}
              <tr><td style="padding:8px 0 2px;font-size:13px;color:#4b5563">Ara toplam</td><td align="right" style="font-size:13px">{Money(o.Subtotal)}</td></tr>
              <tr><td style="padding:2px 0;font-size:13px;color:#4b5563">Kargo</td><td align="right" style="font-size:13px">{shipping}</td></tr>
              <tr><td style="padding:6px 0;font-size:15px"><strong>Toplam</strong></td><td align="right" style="font-size:15px"><strong>{Money(o.Total)}</strong></td></tr>
            </table>
            """;
    }

    private static string BankBox(Order o, EmailOptions s)
    {
        if (string.IsNullOrWhiteSpace(s.Iban))
            return $"<p>Banka ve IBAN bilgilerini {Link($"{Site(s)}/siparislerim?no={Uri.EscapeDataString(o.Number)}", "sipariş sayfanızda")} görebilirsiniz.</p>";

        return $"""
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f9fafb;border-radius:6px">
              <tr><td style="padding:14px 16px;font-size:13px;line-height:1.7">
                {Line("Banka", s.BankName)}
                {Line("Hesap sahibi", s.AccountHolder)}
                IBAN: <strong style="font-family:monospace">{E(s.Iban)}</strong><br>
                Açıklama: <strong>{E(o.Number)}</strong>
              </td></tr>
            </table>
            """;
    }

    private static string Layout(string title, string number, string body, string label = "Sipariş no") => $"""
        <!DOCTYPE html>
        <html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>{E(title)}</title></head>
        <body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px">
            <tr><td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden">
                <tr><td style="background:{Brand};padding:18px 24px;color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:1px">SOYKÖK TİCARET</td></tr>
                <tr><td style="padding:24px">
                  <h1 style="margin:0 0 4px;font-size:20px;color:{Brand}">{E(title)}</h1>
                  <p style="margin:0 0 16px;font-size:13px;color:#6b7280">{E(label)}: <strong style="color:{Accent}">{E(number)}</strong></p>
                  <div style="font-size:14px;line-height:1.6">{body}</div>
                </td></tr>
                <tr><td style="padding:16px 24px;background:#f9fafb;font-size:11px;color:#9ca3af">
                  Bu e-posta siparişinizle ilgili bilgilendirme amacıyla gönderilmiştir. © {DateTime.UtcNow.Year} Soykök Ticaret
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body></html>
        """;

    private static string Button(string href, string text) => $"""
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 8px"><tr>
          <td style="background:{Brand};border-radius:4px"><a href="{E(href)}" style="display:inline-block;padding:12px 22px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px">{E(text)}</a></td>
        </tr></table>
        """;

    private static string Link(string href, string text) => $"""<a href="{E(href)}" style="color:{Accent}">{E(text)}</a>""";

    private static string Line(string label, string? value) =>
        string.IsNullOrWhiteSpace(value) ? "" : label + ": <strong>" + E(value) + "</strong><br>";

    private static string Reason(string? note) => string.IsNullOrWhiteSpace(note) ? "" : " Açıklama: " + E(note);

    private static string Site(EmailOptions s) => s.SiteUrl.TrimEnd('/');
    private static string Money(decimal v) => v.ToString("N2", Tr) + " TL";
    private static string E(string? s) => WebUtility.HtmlEncode(s ?? "");
}
