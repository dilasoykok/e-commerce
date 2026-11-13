using Soykok.Api.Endpoints;
using System.Threading.RateLimiting;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Soykok.Api.Http;
using Soykok.Api.Uploads;
using Soykok.Application;
using Soykok.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Katmanlar: Application (kullanım senaryoları) + Infrastructure (PostgreSQL, Redis, RabbitMQ, Keycloak)
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.Configure<UploadOptions>(builder.Configuration.GetSection(UploadOptions.Section));
// İletişim formu: IP başına 10 dakikada 5 mesaj (spam'e karşı)
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy(ContactEndpoints.RateLimitPolicy, http => RateLimitPartition.GetFixedWindowLimiter(
        ContactEndpoints.ClientIp(http),
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(10), QueueLimit = 0 }));
    o.AddPolicy(PaymentEndpoints.InstallmentRateLimitPolicy, http => RateLimitPartition.GetFixedWindowLimiter(
        ContactEndpoints.ClientIp(http),
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 60, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});
builder.Services.AddExceptionHandler<DomainExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

// Admin panelinden yüklenen görseller: /api/files/products/xxx.jpg (adları rastgele, değişmez → uzun önbellek)
var uploads = app.Services.GetRequiredService<IOptions<UploadOptions>>().Value;
Directory.CreateDirectory(uploads.RootPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploads.RootPath),
    RequestPath = UploadOptions.RequestPath,
    OnPrepareResponse = ctx => ctx.Context.Response.Headers.CacheControl = "public, max-age=31536000, immutable",
});
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// Tüm uç noktalar /api altında (nginx /api/ isteklerini bu servise yönlendirir)
app.MapOpenApi("/api/openapi/{documentName}.json");
var api = app.MapGroup("/api");
api.MapSystemEndpoints();
api.MapAuthEndpoints();
api.MapCatalogEndpoints();
api.MapOrderEndpoints();
api.MapAdminOrderEndpoints();
api.MapAdminCategoryEndpoints();
api.MapAdminUploadEndpoints();
api.MapPaymentEndpoints();
api.MapContactEndpoints();
api.MapReviewEndpoints();

// Veritabanı migration'ları ayrı "migrator" servisinde uygulanır (bkz. Soykok.Migrator)
app.Run();
