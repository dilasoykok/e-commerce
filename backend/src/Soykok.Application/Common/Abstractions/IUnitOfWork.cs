namespace Soykok.Application.Common.Abstractions;

/// <summary>Repository'lerde yapılan değişiklikleri tek seferde kaydeder.</summary>
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);

    /// <summary>
    /// <paramref name="action"/> içindeki tüm veritabanı işlemlerini tek transaction'da çalıştırır.
    /// Action <c>Commit = false</c> dönerse ya da hata fırlatırsa her şey geri alınır.
    /// </summary>
    Task<T> ExecuteInTransactionAsync<T>(
        Func<CancellationToken, Task<(T Result, bool Commit)>> action, CancellationToken ct = default);
}
