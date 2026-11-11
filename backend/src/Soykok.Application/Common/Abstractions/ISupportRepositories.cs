using Soykok.Domain.Support;

namespace Soykok.Application.Common.Abstractions;

public interface IContactMessageRepository
{
    void Add(ContactMessage message);
    void Remove(ContactMessage message);
    Task<ContactMessage?> GetAsync(Guid id, CancellationToken ct);
    /// <summary>En yeniler önce. Unread: okunmamış mesaj sayısı (sekmedeki rozet için)</summary>
    Task<(int Total, int Unread, IReadOnlyList<ContactMessage> Items)> SearchAsync(
        bool unreadOnly, int page, int pageSize, CancellationToken ct);
}
