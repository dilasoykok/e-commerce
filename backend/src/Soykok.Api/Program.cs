using Soykok.Api.Endpoints;
using Soykok.Api.Http;
using Soykok.Application;
using Soykok.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Katmanlar: Application (kullanım senaryoları) + Infrastructure (PostgreSQL, Redis, RabbitMQ, Keycloak)
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddExceptionHandler<DomainExceptionHandler>();
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
api.MapAuthEndpoints();
api.MapCatalogEndpoints();
api.MapOrderEndpoints();
api.MapAdminOrderEndpoints();
api.MapPaymentEndpoints();

// Veritabanı migration'ları ayrı "migrator" servisinde uygulanır (bkz. Soykok.Migrator)
app.Run();
