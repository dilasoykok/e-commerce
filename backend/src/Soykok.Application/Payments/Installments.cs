using Soykok.Application.Common.Abstractions;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;

namespace Soykok.Application.Payments;

/// <summary>Ürün sayfası ve ödeme adımındaki taksit tablosu</summary>
/// <param name="Enabled">Kartla ödeme açık mı (kapalıysa arayüz taksit bilgisini hiç göstermez)</param>
/// <param name="MaxInstallments">Herhangi bir kartla yapılabilecek en fazla taksit</param>
/// <param name="InterestFreeInstallments">Toplamı peşin fiyata eşit olan en fazla taksit ("Peşin fiyatına 3 taksit"); yoksa 1</param>
public sealed record InstallmentInfo(
    bool Enabled, decimal Price, int MaxInstallments, int InterestFreeInstallments, IReadOnlyList<CardInstallments> Cards);

public sealed record GetInstallmentsQuery(decimal Price);

public sealed class GetInstallmentsHandler(IPaymentGateway payments)
    : IQueryHandler<GetInstallmentsQuery, Result<InstallmentInfo>>
{
    public const decimal MaxPrice = 1_000_000m;

    public async Task<Result<InstallmentInfo>> HandleAsync(GetInstallmentsQuery query, CancellationToken ct)
    {
        var price = decimal.Round(query.Price, 2);
        if (price is <= 0 or > MaxPrice)
            return Error.Validation(new Dictionary<string, string[]> { ["price"] = ["Geçerli bir tutar girin."] });

        if (!payments.IsEnabled) return new InstallmentInfo(false, price, 1, 1, []);

        var cards = await payments.GetInstallmentsAsync(price, ct);
        var max = cards.SelectMany(c => c.Prices).Select(p => p.Count).DefaultIfEmpty(1).Max();
        // Kuruşluk yuvarlama farklarını vade farkı saymamak için 1 TL tolerans
        var free = cards.SelectMany(c => c.Prices).Where(p => p.Total <= price + 1m).Select(p => p.Count).DefaultIfEmpty(1).Max();
        return new InstallmentInfo(true, price, max, free, cards);
    }
}
