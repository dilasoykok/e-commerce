using System.Net.Mail;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Soykok.Application.Common.Abstractions;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Domain.Support;

namespace Soykok.Application.Support;

/* ======================= Sözleşmeler ======================= */

/// <summary>POST /api/contact gövdesi — alan adları sitedeki iletişim formuyla aynı.</summary>
/// <param name="Website">Spam tuzağı (honeypot): insanlar görmez, doluysa bot</param>
public sealed record SendContactRequest(
    string? Name, string? Email, string? Phone, string? Subject, string? OrderNumber, string? Message,
    bool Kvkk, string? Website);

public sealed record ContactReceipt(bool Received);

public sealed record ContactMessageDto(
    Guid Id, string Name, string Email, string? Phone, string Subject, string SubjectLabel,
    string? OrderNumber, string Message, bool IsRead, DateTimeOffset CreatedAt)
{
    public static ContactMessageDto From(ContactMessage m) => new(
        m.Id, m.Name, m.Email, m.Phone, m.Subject, ContactSubjects.Label(m.Subject),
        m.OrderNumber, m.Message, m.IsRead, m.CreatedAt);
}

public sealed record ContactMessagePage(int Total, int Unread, int Page, int PageSize, IReadOnlyList<ContactMessageDto> Items);

/// <summary>RabbitMQ: contact.received — e-posta servisi admin'e bildirim atar.</summary>
public sealed record ContactReceivedEvent(
    Guid Id, string Name, string Email, string? Phone, string SubjectLabel, string? OrderNumber, string Message,
    DateTimeOffset CreatedAt);

public static class SupportEvents
{
    public const string ContactReceived = "contact.received";
}

/// <summary>Konu kodları — sitedeki formun seçenekleriyle aynı (soykok-web/src/components/contact/ContactForm.tsx)</summary>
public static class ContactSubjects
{
    private static readonly Dictionary<string, string> Labels = new()
    {
        ["urun"] = "Ürün bilgisi",
        ["siparis"] = "Sipariş",
        ["iade"] = "İade ve değişim",
        ["numune"] = "Numune talebi",
        ["proje"] = "Proje / toplu alım teklifi",
        ["diger"] = "Diğer",
    };

    public static bool IsKnown(string? code) => code is not null && Labels.ContainsKey(code);
    public static bool NeedsOrder(string code) => code is "siparis" or "iade";
    public static string Label(string code) => Labels.GetValueOrDefault(code, code);
}

/* ======================= Mesaj gönder (site) ======================= */

public sealed record SendContactCommand(SendContactRequest Request, string? IpAddress);

public sealed partial class SendContactHandler(
    IContactMessageRepository messages,
    IUnitOfWork unitOfWork,
    IEventPublisher events,
    TimeProvider clock,
    ILogger<SendContactHandler> log) : ICommandHandler<SendContactCommand, Result<ContactReceipt>>
{
    public async Task<Result<ContactReceipt>> HandleAsync(SendContactCommand command, CancellationToken ct)
    {
        var r = command.Request;

        // Bot: başarılı gibi cevap ver ama kaydetme (bot formun işe yaramadığını anlamasın)
        if (!string.IsNullOrWhiteSpace(r.Website))
        {
            log.LogInformation("İletişim formu: spam tuzağı doldu, mesaj atıldı ({Ip})", command.IpAddress);
            return new ContactReceipt(true);
        }

        var errors = new Dictionary<string, string[]>();
        void Add(string field, string message) => errors[field] = [message];
        var name = r.Name?.Trim() ?? "";
        var email = r.Email?.Trim() ?? "";
        var phone = NormalizePhone(r.Phone);
        var subject = r.Subject?.Trim() ?? "";
        var orderNumber = r.OrderNumber?.Trim().ToUpperInvariant();
        var message = r.Message?.Trim() ?? "";

        if (name.Length is < 3 or > 100) Add("name", "Adınızı ve soyadınızı girin.");
        if (!IsEmail(email)) Add("email", "Geçerli bir e-posta adresi girin.");
        if (phone is not null && !PhoneRegex().IsMatch(phone)) Add("phone", "Geçerli bir cep telefonu girin (05XX XXX XX XX).");
        if (!ContactSubjects.IsKnown(subject)) Add("subject", "Lütfen bir konu seçin.");
        else if (ContactSubjects.NeedsOrder(subject) && (orderNumber is null || !OrderNumberRegex().IsMatch(orderNumber)))
            Add("orderNumber", "Sipariş numarası SYK-000000-0000 biçiminde olmalıdır.");
        if (message.Length < 10) Add("message", "Lütfen biraz daha ayrıntı yazın.");
        else if (message.Length > ContactMessage.MaxMessageLength)
            Add("message", $"Mesaj en fazla {ContactMessage.MaxMessageLength} karakter olabilir.");
        if (!r.Kvkk) Add("kvkk", "Devam etmek için onay vermeniz gerekir.");
        if (errors.Count > 0) return Error.Validation(errors);

        var entity = ContactMessage.Create(
            name, email, phone, subject, ContactSubjects.NeedsOrder(subject) ? orderNumber : null, message,
            command.IpAddress, clock.GetUtcNow());
        messages.Add(entity);
        await unitOfWork.SaveChangesAsync(ct);

        log.LogInformation("İletişim mesajı alındı: {Id} ({Subject})", entity.Id, entity.Subject);
        await events.PublishAsync(SupportEvents.ContactReceived, new ContactReceivedEvent(
            entity.Id, entity.Name, entity.Email, entity.Phone, ContactSubjects.Label(entity.Subject),
            entity.OrderNumber, entity.Message, entity.CreatedAt), ct);

        return new ContactReceipt(true);
    }

    private static bool IsEmail(string s) =>
        s.Length is > 3 and <= 256 && MailAddress.TryCreate(s, out var m) && m.Address == s && s.Contains('.');

    /// <summary>"+90 532 123 45 67" → "05321234567"; boşsa null</summary>
    private static string? NormalizePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return null;
        var d = new string(phone.Where(char.IsDigit).ToArray());
        if (d.StartsWith("90") && d.Length == 12) d = d[2..];
        if (d.Length == 10) d = "0" + d;
        return d;
    }

    [GeneratedRegex(@"^05\d{9}$")]
    private static partial Regex PhoneRegex();

    [GeneratedRegex(@"^SYK-\d{6}-\d{4,6}$")]
    private static partial Regex OrderNumberRegex();
}

/* ======================= Admin ======================= */

public sealed record ListContactMessagesQuery(bool UnreadOnly, int Page = 1, int PageSize = 20);
public sealed record MarkContactMessageCommand(Guid Id, bool Read);
public sealed record DeleteContactMessageCommand(Guid Id);

public sealed class ContactMessagesAdminHandler(
    IContactMessageRepository messages,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
    : IQueryHandler<ListContactMessagesQuery, ContactMessagePage>,
      ICommandHandler<MarkContactMessageCommand, Result<ContactMessageDto>>,
      ICommandHandler<DeleteContactMessageCommand, Result>
{
    public async Task<ContactMessagePage> HandleAsync(ListContactMessagesQuery query, CancellationToken ct)
    {
        var page = Math.Max(query.Page, 1);
        var size = Math.Clamp(query.PageSize, 1, 100);
        var (total, unread, items) = await messages.SearchAsync(query.UnreadOnly, page, size, ct);
        return new ContactMessagePage(total, unread, page, size, items.Select(ContactMessageDto.From).ToList());
    }

    public async Task<Result<ContactMessageDto>> HandleAsync(MarkContactMessageCommand command, CancellationToken ct)
    {
        var message = await messages.GetAsync(command.Id, ct);
        if (message is null) return NotFound();
        message.MarkRead(command.Read, clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(ct);
        return ContactMessageDto.From(message);
    }

    public async Task<Result> HandleAsync(DeleteContactMessageCommand command, CancellationToken ct)
    {
        var message = await messages.GetAsync(command.Id, ct);
        if (message is null) return NotFound();
        messages.Remove(message);
        await unitOfWork.SaveChangesAsync(ct);
        return Result.Success();
    }

    private static Error NotFound() => Error.NotFound("support.message_not_found", "Mesaj bulunamadı.");
}
