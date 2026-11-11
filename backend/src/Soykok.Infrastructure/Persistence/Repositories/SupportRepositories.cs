using Microsoft.EntityFrameworkCore;
using Soykok.Application.Common.Abstractions;
using Soykok.Domain.Support;

namespace Soykok.Infrastructure.Persistence.Repositories;

internal sealed class ContactMessageRepository(AppDbContext db) : IContactMessageRepository
{
    public void Add(ContactMessage message) => db.ContactMessages.Add(message);
    public void Remove(ContactMessage message) => db.ContactMessages.Remove(message);

    public Task<ContactMessage?> GetAsync(Guid id, CancellationToken ct) =>
        db.ContactMessages.FirstOrDefaultAsync(m => m.Id == id, ct);

    public async Task<(int Total, int Unread, IReadOnlyList<ContactMessage> Items)> SearchAsync(
        bool unreadOnly, int page, int pageSize, CancellationToken ct)
    {
        var all = db.ContactMessages.AsNoTracking();
        var query = unreadOnly ? all.Where(m => !m.IsRead) : all;
        var total = await query.CountAsync(ct);
        var unread = unreadOnly ? total : await all.CountAsync(m => !m.IsRead, ct);
        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
        return (total, unread, items);
    }
}
