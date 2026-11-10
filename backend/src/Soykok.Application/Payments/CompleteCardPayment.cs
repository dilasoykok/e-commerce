using Microsoft.Extensions.Logging;
using Soykok.Application.Common.Abstractions;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Application.Ordering.Admin;
using Soykok.Domain.Ordering;

namespace Soykok.Application.Payments;

/// <param name="Token">Ödeme kuruluşunun geri dönüşte gönderdiği token</param>
/// <param name="OrderNumber">Geri dönüş adresine bizim eklediğimiz sipariş numarası</param>
public sealed record CompleteCardPaymentCommand(string? Token, string? OrderNumber);

public sealed record CardPaymentResult(bool Success, string? OrderNumber, string? Message)
{
    public static CardPaymentResult Fail(string? number, string message) => new(false, number, message);
}

/// <summary>
/// Kartla ödeme geri dönüşü:
///  - Sonuç tarayıcıdan değil, token ile doğrudan iyzico'dan sorulur (imza da kontrol edilir)
///  - Başarılıysa sipariş "Ödeme Bekleniyor" → "Sipariş Alındı"
///  - Başarısızsa sipariş iptal edilir, ayrılan stok geri bırakılır (müşteri sepetinden tekrar deneyebilir)
///  - Aynı geri dönüş iki kez gelirse (sayfa yenileme) siparişin mevcut durumuna göre cevap verilir
/// </summary>
public sealed class CompleteCardPaymentHandler(
    IPaymentGateway gateway,
    IOrderRepository orders,
    ICommandHandler<ChangeOrderStatusCommand, Result<AdminOrderDetail>> changeStatus,
    ILogger<CompleteCardPaymentHandler> log) : ICommandHandler<CompleteCardPaymentCommand, CardPaymentResult>
{
    private const string By = "iyzico";

    public async Task<CardPaymentResult> HandleAsync(CompleteCardPaymentCommand command, CancellationToken ct)
    {
        var number = command.OrderNumber?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(command.Token) || string.IsNullOrEmpty(number))
            return CardPaymentResult.Fail(null, "Ödeme sonucu okunamadı.");

        var order = await orders.FindByNumberAsync(number, ct);
        if (order is null || order.PaymentMethod != PaymentMethod.Card)
            return CardPaymentResult.Fail(null, "Sipariş bulunamadı.");

        // Daha önce sonuçlanmış (ör. sayfa yenilendi)
        if (order.Status != OrderStatus.AwaitingPayment)
            return order.Status == OrderStatus.Cancelled
                ? CardPaymentResult.Fail(number, "Bu siparişin ödemesi tamamlanamamıştı.")
                : new CardPaymentResult(true, number, null);

        PaymentOutcome outcome;
        try
        {
            outcome = await gateway.GetCheckoutResultAsync(command.Token.Trim(), number, ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Para çekilmiş olabilir: siparişi iptal etmeden bırak, admin kontrol etsin
            log.LogError(ex, "Ödeme sonucu sorgulanamadı: {Number}", number);
            return CardPaymentResult.Fail(number,
                "Ödeme sonucu şu an doğrulanamadı. Kartınızdan çekim yapıldıysa sipariş kısa sürede onaylanır; lütfen bizimle iletişime geçin.");
        }

        if (outcome.OrderNumber is not null && !string.Equals(outcome.OrderNumber, number, StringComparison.OrdinalIgnoreCase))
        {
            log.LogWarning("Ödeme sonucu başka siparişe ait: {Expected} / {Actual}", number, outcome.OrderNumber);
            return CardPaymentResult.Fail(number, "Ödeme sonucu bu siparişle eşleşmedi.");
        }

        if (outcome.Success)
        {
            if (outcome.PaidPrice < order.Total)
            {
                // Çekim var ama tutar eksik: iptal etme, elle incelensin
                log.LogCritical("Eksik tahsilat: {Number} sipariş {Total} TL, çekilen {Paid} TL (ödeme {PaymentId})",
                    number, order.Total, outcome.PaidPrice, outcome.PaymentId);
                return CardPaymentResult.Fail(number, "Ödeme tutarı sipariş tutarıyla eşleşmedi; ekibimiz sizinle iletişime geçecek.");
            }

            var paid = await changeStatus.HandleAsync(new ChangeOrderStatusCommand(
                number, "received", $"Kartla ödendi (iyzico ödeme no: {outcome.PaymentId})", By), ct);
            if (paid.Error is { } e) log.LogError("Ödenen sipariş onaylanamadı: {Number} ({Error})", number, e.Message);
            return new CardPaymentResult(true, number, null);
        }

        var message = string.IsNullOrWhiteSpace(outcome.ErrorMessage) ? "Ödeme tamamlanamadı." : outcome.ErrorMessage;
        var cancelled = await changeStatus.HandleAsync(new ChangeOrderStatusCommand(
            number, "cancelled", $"Kart ödemesi tamamlanamadı: {Truncate(message, 400)}", By), ct);
        if (!cancelled.IsSuccess) log.LogError("Ödemesi başarısız sipariş iptal edilemedi: {Number}", number);

        log.LogInformation("Kart ödemesi başarısız: {Number} ({Message})", number, message);
        return CardPaymentResult.Fail(number, message);
    }

    private static string Truncate(string s, int max) => s.Length <= max ? s : s[..max];
}
