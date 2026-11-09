using Soykok.Application.Common.Results;

namespace Soykok.Application.Catalog;

public static class CatalogErrors
{
    public static Error ProductNotFound(string id) =>
        Error.NotFound("catalog.product_not_found", $"'{id}' kodlu ürün bulunamadı.");

    public static Error ProductAlreadyExists(string id) =>
        Error.Conflict("catalog.product_exists", $"'{id}' kodlu ürün zaten var.");
}
