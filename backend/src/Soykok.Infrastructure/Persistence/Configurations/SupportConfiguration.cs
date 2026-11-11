using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Soykok.Domain.Support;

namespace Soykok.Infrastructure.Persistence.Configurations;

internal sealed class ContactMessageConfiguration : IEntityTypeConfiguration<ContactMessage>
{
    public void Configure(EntityTypeBuilder<ContactMessage> e)
    {
        e.ToTable("contact_messages", Schemas.Support);
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedNever();
        e.Property(x => x.Name).HasMaxLength(100);
        e.Property(x => x.Email).HasMaxLength(256);
        e.Property(x => x.Phone).HasMaxLength(20);
        e.Property(x => x.Subject).HasMaxLength(32);
        e.Property(x => x.OrderNumber).HasMaxLength(32);
        e.Property(x => x.Message).HasMaxLength(ContactMessage.MaxMessageLength);
        e.Property(x => x.IpAddress).HasMaxLength(64);
        e.HasIndex(x => x.CreatedAt);
        e.HasIndex(x => x.IsRead);
    }
}
