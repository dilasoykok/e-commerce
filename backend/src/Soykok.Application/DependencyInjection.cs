using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Soykok.Application.Catalog;
using Soykok.Application.Catalog.Commands;
using Soykok.Application.Catalog.Contracts;
using Soykok.Application.Catalog.Queries;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;

namespace Soykok.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.TryAddSingleton(TimeProvider.System);

        // Katalog
        services.AddScoped<CatalogSnapshotProvider>();
        services.AddScoped<ProductInputValidator>();

        services.AddScoped<IQueryHandler<GetProductsQuery, ProductPage>, GetProductsHandler>();
        services.AddScoped<IQueryHandler<GetProductByIdQuery, Result<ProductDetail>>, GetProductByIdHandler>();
        services.AddScoped<IQueryHandler<GetCategoriesQuery, CatalogCategories>, GetCategoriesHandler>();

        services.AddScoped<ICommandHandler<CreateProductCommand, Result<ProductDetail>>, CreateProductHandler>();
        services.AddScoped<ICommandHandler<UpdateProductCommand, Result<ProductDetail>>, UpdateProductHandler>();
        services.AddScoped<ICommandHandler<DeleteProductCommand, Result>, DeleteProductHandler>();

        return services;
    }
}
