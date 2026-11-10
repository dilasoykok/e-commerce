using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Soykok.Application.Common.Abstractions;
using Soykok.Infrastructure.Caching;
using Soykok.Infrastructure.Health;
using Soykok.Infrastructure.Identity;
using Soykok.Infrastructure.Messaging;
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
