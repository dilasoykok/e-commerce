using Microsoft.EntityFrameworkCore;
using Soykok.Api.Data;
using Soykok.Api.Endpoints;
using Soykok.Api.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// PostgreSQL
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

// Redis (önbellek)
builder.Services.AddStackExchangeRedisCache(o =>
{
    o.Configuration = builder.Configuration.GetConnectionString("Redis");
    o.InstanceName = "soykok:";
});

// RabbitMQ (olaylar)
builder.Services.Configure<RabbitMqOptions>(builder.Configuration.GetSection("RabbitMQ"));
builder.Services.AddSingleton<IEventPublisher, RabbitMqPublisher>();

// Keycloak (JWT)
builder.Services.AddKeycloakAuth(builder.Configuration);

builder.Services.AddScoped<CatalogCache>();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseAuthentication();
app.UseAuthorization();

// Tüm uç noktalar /api altında (nginx /api/ isteklerini bu servise yönlendirir)
app.MapOpenApi("/api/openapi/{documentName}.json");
var api = app.MapGroup("/api");
api.MapSystemEndpoints();
api.MapCatalogEndpoints();

await InitializeDatabaseAsync(app);
app.Run();

// PostgreSQL hazır olana kadar birkaç kez dener, sonra şemayı kurup örnek veriyi yükler.
static async Task InitializeDatabaseAsync(WebApplication app)
{
    for (var attempt = 1; ; attempt++)
    {
        try
        {
            await SeedData.InitializeAsync(app.Services);
            return;
        }
        catch (Exception ex) when (attempt < 10)
        {
            app.Logger.LogWarning(ex, "Veritabanı hazır değil, tekrar denenecek ({Attempt}/10)", attempt);
            await Task.Delay(TimeSpan.FromSeconds(3));
        }
    }
}
