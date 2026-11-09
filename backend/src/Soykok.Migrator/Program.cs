using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Soykok.Infrastructure;
using Soykok.Infrastructure.Persistence;

// Migration'ları uygular + örnek veriyi yükler, sonra çıkar.
// Başarılıysa 0, değilse 1 ile çıkar; docker compose API'yi yalnızca başarılıysa başlatır.

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddPersistence(builder.Configuration);

using var host = builder.Build();
var log = host.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Migrator");

try
{
    await host.Services.MigrateAndSeedAsync();
    log.LogInformation("Veritabanı hazır");
    return 0;
}
catch (Exception ex)
{
    log.LogCritical(ex, "Migration başarısız");
    return 1;
}
