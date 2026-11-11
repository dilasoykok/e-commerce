using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Payments;

namespace Soykok.Infrastructure.Payments;

/// <summary>5 dakikada bir yarım kalan kart ödemelerini sonuçlandırır (bkz. PendingCardPaymentsHandler).</summary>
internal sealed class PendingPaymentWorker(
    IOptions<IyzicoOptions> options,
    IServiceScopeFactory scopes,
    TimeProvider clock,
    ILogger<PendingPaymentWorker> log) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Value.IsConfigured) return; // kartla ödeme kapalı

        // API açılırken veritabanı/iyzico işleri sıkışmasın
        try { await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken); }
        catch (OperationCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                var handler = scope.ServiceProvider.GetRequiredService<ICommandHandler<ResolvePendingCardPaymentsCommand, int>>();
                var count = await handler.HandleAsync(new ResolvePendingCardPaymentsCommand(clock.GetUtcNow()), stoppingToken);
                if (count > 0) log.LogInformation("{Count} yarım kalan kart ödemesi sonuçlandırıldı.", count);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                log.LogError(ex, "Yarım kalan kart ödemeleri kontrol edilemedi; sonraki turda yeniden denenecek.");
            }

            try { await Task.Delay(Interval, stoppingToken); }
            catch (OperationCanceledException) { return; }
        }
    }
}
