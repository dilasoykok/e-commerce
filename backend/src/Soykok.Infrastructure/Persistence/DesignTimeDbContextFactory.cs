using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Soykok.Infrastructure.Persistence;

/// <summary>
/// "dotnet ef migrations add" komutu DbContext'i buradan oluşturur (uygulamayı başlatmadan).
/// Migration üretmek için veritabanına bağlanılmaz; bağlantı dizesi yalnızca sağlayıcıyı seçmek içindir.
/// </summary>
internal sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
            ?? "Host=localhost;Port=5432;Database=ecommerce;Username=ecommerce;Password=design-time";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString, npgsql => npgsql.MigrationsHistoryTable("__ef_migrations_history", "public"))
            .Options;

        return new AppDbContext(options);
    }
}
