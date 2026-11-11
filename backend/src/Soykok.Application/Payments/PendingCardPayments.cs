using Microsoft.Extensions.Logging;
using Soykok.Application.Common.Abstractions;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Application.Ordering.Admin;

namespace Soykok.Application.Payments;

/// <param name="Now">Şimdiki zaman; bundan <see cref="PendingCardPaymentsHandler.Timeout"/> önce verilmiş siparişler kontrol edilir</param>
public sealed record ResolvePendingCardPaymentsCommand(DateTimeOffset Now);

/// <summary>
/// Yarım kalan kart ödemeleri: müşteri iyzico ödeme sayfasında tarayıcıyı kapatırsa geri dönüş hiç gelmez,
/// sipariş "Ödeme Bekleniyor"da kalır ve stok ayrılı durur. Bu işleyici (5 dakikada bir çalışır)
/// iyzico ödeme oturumu süresi (30 dk) dolmuş siparişlerin sonucunu token ile iyzico'ya sorar:
///   - ödenmişse "Sipariş Alındı" (müşteriye onay maili gider)
///   - ödenmemişse iptal, stok geri
///   - iyzico'ya ulaşılamazsa dokunulmaz, sonraki turda yeniden denenir
/// Token'ı olmayan sipariş (ödeme sayfası hiç açılamamış) doğrudan iptal edilir.
/// </summary>
public sealed class PendingCardPaymentsHandler(
    IOrderRepository orders,
    ICommandHandler<CompleteCardPaymentCommand, CardPaymentResult> completePayment,
    ICommandHandler<ChangeOrderStatusCommand, Result<AdminOrderDetail>> changeStatus,
    ILogger<PendingCardPaymentsHandler> log) : ICommandHandler<ResolvePendingCardPaymentsCommand, int>
{
    /// <summary>iyzico ödeme sayfası 30 dk geçerli; 5 dk pay bırakılır</summary>
    public static readonly TimeSpan Timeout = TimeSpan.FromMinutes(35);
    private const int BatchSize = 50;

    public async Task<int> HandleAsync(ResolvePendingCardPaymentsCommand command, CancellationToken ct)
    {
        var pending = await orders.ListPendingCardPaymentsAsync(command.Now - Timeout, BatchSize, ct);
        var resolved = 0;

        foreach (var (number, token) in pending)
        {
            if (string.IsNullOrEmpty(token))
            {
                var cancelled = await changeStatus.HandleAsync(new ChangeOrderStatusCommand(
                    number, "cancelled", "Kart ödemesi tamamlanmadı (ödeme sayfası açılamadı, süre doldu)", "sistem"), ct);
                if (cancelled.IsSuccess) resolved++;
                continue;
            }

            var result = await completePayment.HandleAsync(new CompleteCardPaymentCommand(token, number), ct);
            log.LogInformation("Yarım kalan kart ödemesi {Number}: {Result}", number,
                result.Success ? "ödenmiş, onaylandı" : result.Message);
            resolved++;
        }

        return resolved;
    }
}
