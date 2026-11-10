using Soykok.Api.Endpoints;
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

// Veritabanı migration'ları ayrı "migrator" servisinde uygulanır (bkz. Soykok.Migrator)
app.Run();
