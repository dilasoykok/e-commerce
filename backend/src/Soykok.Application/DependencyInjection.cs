using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Soykok.Application.Catalog;
using Soykok.Application.Catalog.Admin;
using Soykok.Application.Catalog.Commands;
using Soykok.Application.Catalog.Contracts;
using Soykok.Application.Catalog.Queries;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Application.Ordering.Admin;
using Soykok.Application.Ordering.Commands;
using Soykok.Application.Ordering.Contracts;
using Soykok.Application.Ordering.Queries;
using Soykok.Application.Payments;
using Soykok.Application.Support;

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

        // Kategori yönetimi (admin): tek sınıf, her işlem ayrı arayüzle
        services.AddScoped<AdminCategoriesHandler>();
        services.AddScoped<IQueryHandler<GetAdminCategoriesQuery, AdminCategoryList>>(sp => sp.GetRequiredService<AdminCategoriesHandler>());
        services.AddScoped<ICommandHandler<CreateCategoryCommand, Result<AdminCategoryList>>>(sp => sp.GetRequiredService<AdminCategoriesHandler>());
        services.AddScoped<ICommandHandler<UpdateCategoryCommand, Result<AdminCategoryList>>>(sp => sp.GetRequiredService<AdminCategoriesHandler>());
        services.AddScoped<ICommandHandler<DeleteCategoryCommand, Result<AdminCategoryList>>>(sp => sp.GetRequiredService<AdminCategoriesHandler>());
        services.AddScoped<ICommandHandler<CreateCategoryGroupCommand, Result<AdminCategoryList>>>(sp => sp.GetRequiredService<AdminCategoriesHandler>());
        services.AddScoped<ICommandHandler<UpdateCategoryGroupCommand, Result<AdminCategoryList>>>(sp => sp.GetRequiredService<AdminCategoriesHandler>());
        services.AddScoped<ICommandHandler<DeleteCategoryGroupCommand, Result<AdminCategoryList>>>(sp => sp.GetRequiredService<AdminCategoriesHandler>());

        // Siparişler
        services.AddScoped<ICommandHandler<PlaceOrderCommand, Result<OrderDetail>>, PlaceOrderHandler>();
        services.AddScoped<IQueryHandler<GetMyOrdersQuery, IReadOnlyList<OrderSummary>>, GetMyOrdersHandler>();
        services.AddScoped<IQueryHandler<GetMyOrderQuery, Result<OrderDetail>>, GetMyOrderHandler>();
        services.AddScoped<IQueryHandler<TrackOrderQuery, Result<OrderDetail>>, TrackOrderHandler>();

        // Sipariş yönetimi (admin)
        services.AddScoped<IQueryHandler<ListOrdersQuery, AdminOrderPage>, ListOrdersHandler>();
        services.AddScoped<IQueryHandler<GetAdminOrderQuery, Result<AdminOrderDetail>>, GetAdminOrderHandler>();
        services.AddScoped<ICommandHandler<ChangeOrderStatusCommand, Result<AdminOrderDetail>>, ChangeOrderStatusHandler>();

        // İletişim formu + admin mesajları
        services.AddScoped<ICommandHandler<SendContactCommand, Result<ContactReceipt>>, SendContactHandler>();
        services.AddScoped<ContactMessagesAdminHandler>();
        services.AddScoped<IQueryHandler<ListContactMessagesQuery, ContactMessagePage>>(sp => sp.GetRequiredService<ContactMessagesAdminHandler>());
        services.AddScoped<ICommandHandler<MarkContactMessageCommand, Result<ContactMessageDto>>>(sp => sp.GetRequiredService<ContactMessagesAdminHandler>());
        services.AddScoped<ICommandHandler<DeleteContactMessageCommand, Result>>(sp => sp.GetRequiredService<ContactMessagesAdminHandler>());

        // Kartla ödeme geri dönüşü
        services.AddScoped<ICommandHandler<CompleteCardPaymentCommand, CardPaymentResult>, CompleteCardPaymentHandler>();
        services.AddScoped<ICommandHandler<ResolvePendingCardPaymentsCommand, int>, PendingCardPaymentsHandler>();

        return services;
    }
}
