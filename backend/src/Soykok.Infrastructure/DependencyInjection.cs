using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Soykok.Application.Common.Abstractions;
using Soykok.Infrastructure.Caching;
using Soykok.Infrastructure.Health;
using Soykok.Infrastructure.Identity;
using Soykok.Infrastructure.Messaging;
using Soykok.Infrastructure.Notifications;
using Soykok.Infrastructure.Payments;
using Soykok.Infrastructure.Persistence;
using Soykok.Infrastructure.Persistence.Repositories;

namespace Soykok.Infrastructure;

public static class DependencyInjection
{
    /// <summary>Yalnızca veritabanı katmanı (API ve migrator ortak kullanır).</summary>
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<AppDbContext>(o => o.UseNpgsql(config.GetConnectionString("Postgres"),
            npgsql => npgsql.MigrationsHistoryTable("__ef_migrations_history", "public")));
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<ICatalogReadRepository, CatalogReadRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<ICustomerRepository, CustomerRepository>();
        services.AddScoped<IStockReservation, StockReservation>();
        return services;
    }

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        // PostgreSQL (EF Core)
        services.AddPersistence(config);

        // Redis (önbellek + oturumlar)
        services.AddStackExchangeRedisCache(o =>
        {
            o.Configuration = config.GetConnectionString("Redis");
            o.InstanceName = "soykok:";
        });
        services.AddScoped<ICatalogCache, RedisCatalogCache>();

        // RabbitMQ (olaylar) — tek bağlantı, uygulama boyunca paylaşılır
        services.Configure<RabbitMqOptions>(config.GetSection(RabbitMqOptions.Section));
        services.AddSingleton<RabbitMqPublisher>();
        services.AddSingleton<IEventPublisher>(sp => sp.GetRequiredService<RabbitMqPublisher>());

        // Sipariş e-postaları (SMTP). Ayar yoksa gönderim kapalı; servis kuyruğu dinlemez.
        services.Configure<EmailOptions>(config.GetSection(EmailOptions.Section));
        services.AddSingleton<SmtpEmailSender>();
        services.AddHostedService<OrderEmailWorker>();

        // iyzico (kartla ödeme). Anahtarlar yoksa kartla ödeme kapalı, havale çalışmaya devam eder.
        services.Configure<IyzicoOptions>(config.GetSection(IyzicoOptions.Section));
        services.AddHttpClient<IPaymentGateway, IyzicoPaymentGateway>(c => c.Timeout = TimeSpan.FromSeconds(30));

        // Keycloak (site için oturum çerezi, araçlar için JWT)
        services.AddKeycloakAuthentication(config);

        // Sağlık kontrolleri (GET /api/health)
        services.AddHealthChecks()
            .AddCheck<PostgresHealthCheck>(HealthCheckNames.Postgres)
            .AddCheck<RedisHealthCheck>(HealthCheckNames.Redis)
            .AddCheck<RabbitMqHealthCheck>(HealthCheckNames.RabbitMq);

        return services;
    }
}
