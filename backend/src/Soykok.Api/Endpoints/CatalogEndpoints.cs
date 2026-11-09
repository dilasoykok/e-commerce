using Microsoft.AspNetCore.Mvc;
using Soykok.Api.Http;
using Soykok.Application.Catalog.Commands;
using Soykok.Application.Catalog.Contracts;
using Soykok.Application.Catalog.Queries;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Infrastructure.Identity;

namespace Soykok.Api.Endpoints;

public static class CatalogEndpoints
{
    /// <summary>Ürün ekleme isteği: isteğe bağlı kod + ürün bilgileri.</summary>
    public sealed record CreateProductRequest(
        string? Id, string Name, string Brand, string Category, string? Unit, string Image,
        decimal Price, decimal? OldPrice, string? Badge, string? BadgeType, decimal? BoxM2,
        string[]? Images, string? Description, string[]? Features, Dictionary<string, string>? Specs)
    {
        public ProductInput ToInput() => new(
            Name, Brand, Category, Unit, Image, Price, OldPrice, Badge, BadgeType, BoxM2,
            Images, Description, Features, Specs);
    }

    public static RouteGroupBuilder MapCatalogEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/categories", GetCategories).WithTags("Catalog");

        var products = api.MapGroup("/products").WithTags("Catalog");
        products.MapGet("/", GetProducts);
        products.MapGet("/{id}", GetProduct);
        products.MapPost("/", CreateProduct).RequireAuthorization(AuthConstants.AdminPolicy);
        products.MapPut("/{id}", UpdateProduct).RequireAuthorization(AuthConstants.AdminPolicy);
        products.MapDelete("/{id}", DeleteProduct).RequireAuthorization(AuthConstants.AdminPolicy);

        return api;
    }

    // GET /api/categories
    private static async Task<IResult> GetCategories(
        IQueryHandler<GetCategoriesQuery, CatalogCategories> handler, CancellationToken ct) =>
        Results.Ok(await handler.HandleAsync(new GetCategoriesQuery(), ct));

    // GET /api/products?q=&kategori=parke,lvt&marka=Egger&min=&max=&indirim=1&sirala=fiyat-artan&page=1&pageSize=24
    // Parametre adları urunler.html'in adres çubuğundakilerle aynı.
    private static async Task<IResult> GetProducts(
        IQueryHandler<GetProductsQuery, ProductPage> handler,
        CancellationToken ct,
        [FromQuery] string? q = null,
        [FromQuery(Name = "kategori")] string? kategori = null,
        [FromQuery(Name = "marka")] string? marka = null,
        [FromQuery] decimal? min = null,
        [FromQuery] decimal? max = null,
        [FromQuery(Name = "indirim")] string? indirim = null,
        [FromQuery(Name = "sirala")] string? sirala = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24)
    {
        var query = new GetProductsQuery(q, kategori, marka, min, max, indirim == "1", sirala, page, pageSize);
        return Results.Ok(await handler.HandleAsync(query, ct));
    }

    // GET /api/products/{id}
    private static async Task<IResult> GetProduct(
        string id, IQueryHandler<GetProductByIdQuery, Result<ProductDetail>> handler, CancellationToken ct) =>
        (await handler.HandleAsync(new GetProductByIdQuery(id), ct)).ToHttp(product => Results.Ok(product));

    // POST /api/products   (admin)
    private static async Task<IResult> CreateProduct(
        CreateProductRequest request,
        ICommandHandler<CreateProductCommand, Result<ProductDetail>> handler,
        CancellationToken ct) =>
        (await handler.HandleAsync(new CreateProductCommand(request.Id, request.ToInput()), ct))
            .ToHttp(product => Results.Created($"/api/products/{product.Id}", product));

    // PUT /api/products/{id}   (admin)
    private static async Task<IResult> UpdateProduct(
        string id,
        ProductInput request,
        ICommandHandler<UpdateProductCommand, Result<ProductDetail>> handler,
        CancellationToken ct) =>
        (await handler.HandleAsync(new UpdateProductCommand(id, request), ct)).ToHttp(product => Results.Ok(product));

    // DELETE /api/products/{id}   (admin)
    private static async Task<IResult> DeleteProduct(
        string id, ICommandHandler<DeleteProductCommand, Result> handler, CancellationToken ct) =>
        (await handler.HandleAsync(new DeleteProductCommand(id), ct)).ToHttp(() => Results.NoContent());
}
