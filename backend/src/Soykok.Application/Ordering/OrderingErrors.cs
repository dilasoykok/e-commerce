using Soykok.Application.Common.Results;

namespace Soykok.Application.Ordering;

public static class OrderingErrors
{
    public static Error OrderNotFound() =>
        Error.NotFound("ordering.order_not_found", "Sipariş bulunamadı. Sipariş numarasını ve e-posta adresini kontrol edin.");

    public static Error OutOfStock(IEnumerable<string> lines) =>
        Error.Conflict("ordering.out_of_stock", "Yetersiz stok: " + string.Join("; ", lines) + ". Lütfen sepetinizi güncelleyin.");

    public static Error Validation(Dictionary<string, string[]> fields) => Error.Validation(fields);
}

/// <summary>Kargo ücreti kuralı. Arayüzdeki (soykok-web/src/lib/shipping.ts) değerlerle aynı olmalı.</summary>
public static class ShippingPolicy
{
    public const decimal FreeShippingLimit = 1000m;
    public const decimal Fee = 149m;

    public static decimal FeeFor(decimal subtotal) => subtotal >= FreeShippingLimit ? 0 : Fee;
}
