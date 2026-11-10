using Soykok.Domain.Customers;
using Soykok.Domain.Ordering;

namespace Soykok.Application.Common.Abstractions;

public interface IOrderRepository
{
    void Add(Order order);
    Task<bool> NumberExistsAsync(string number, CancellationToken ct);

    /// <summary>Kalemler ve durum geçmişiyle birlikte (takip edilmez).</summary>
    Task<Order?> FindByNumberAsync(string number, CancellationToken ct);

    /// <summary>Durum değiştirmek için (takip edilir; kalemler ve geçmişle).</summary>
    Task<Order?> GetForUpdateAsync(string number, CancellationToken ct);

    /// <summary>Admin listesi: durum ve metin (numara, ad, e-posta, telefon) filtresi, yeniden eskiye.</summary>
    Task<(int Total, IReadOnlyList<Order> Items)> SearchAsync(
        OrderStatus? status, string? search, int page, int pageSize, CancellationToken ct);

    /// <summary>Müşterinin siparişleri, yeniden eskiye (kalemlerle birlikte, takip edilmez).</summary>
    Task<IReadOnlyList<Order>> ListByCustomerAsync(Guid customerId, int take, CancellationToken ct);
}

public interface ICustomerRepository
{
    Task<Customer?> FindByIdentityIdAsync(string identityId, CancellationToken ct);
    void Add(Customer customer);
}

/// <summary>Stoktan düşme. Yarış durumunda fazla satışı önlemek için tek SQL ile koşullu düşer.</summary>
public interface IStockReservation
{
    /// <summary>
    /// Her ürün için stoktan düşer. Stok kaydı olmayan ürünler (stok takibi yapılmayan) atlanır.
    /// Yetersiz stokta hiçbir şey kaydedilmez ve yetersiz kalan ürün kodları döner.
    /// Bir transaction içinde çağrılmalı (bkz. <see cref="IUnitOfWork.ExecuteInTransactionAsync{T}"/>).
    /// </summary>
    Task<IReadOnlyList<StockShortage>> TryReserveAsync(
        IReadOnlyDictionary<string, int> quantities, DateTimeOffset now, CancellationToken ct);

    /// <summary>İptal edilen siparişin adetlerini stoğa geri ekler (stok kaydı olmayanlar atlanır).</summary>
    Task ReleaseAsync(IReadOnlyDictionary<string, int> quantities, DateTimeOffset now, CancellationToken ct);
}

public sealed record StockShortage(string ProductId, int Available);
