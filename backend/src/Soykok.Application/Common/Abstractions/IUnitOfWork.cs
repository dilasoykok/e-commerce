namespace Soykok.Application.Common.Abstractions;

/// <summary>Repository'lerde yapılan değişiklikleri tek seferde kaydeder.</summary>
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
