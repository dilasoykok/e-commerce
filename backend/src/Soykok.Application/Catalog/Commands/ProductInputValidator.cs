using Soykok.Application.Catalog.Contracts;
using Soykok.Application.Common.Abstractions;
using Soykok.Domain.Catalog;

namespace Soykok.Application.Catalog.Commands;

/// <summary>
/// İstek doğrulaması: kullanıcıya alan bazlı hata mesajı döndürmek için.
/// (Aynı kurallar Domain'de de korunur; bu katman güzel hata mesajı içindir.)
/// </summary>
public sealed class ProductInputValidator(ICategoryRepository categories)
{
    public async Task<Dictionary<string, string[]>> ValidateAsync(ProductInput input, CancellationToken ct)
    {
        var errors = new Dictionary<string, string[]>();
        void Add(string field, string message) => errors[field] = [message];

        if (string.IsNullOrWhiteSpace(input.Name)) Add("name", "Ürün adı zorunlu.");
        if (string.IsNullOrWhiteSpace(input.Brand)) Add("brand", "Marka zorunlu.");
        if (string.IsNullOrWhiteSpace(input.Image)) Add("image", "Görsel zorunlu.");
        if (input.Price <= 0) Add("price", "Fiyat sıfırdan büyük olmalı.");
        if (input.OldPrice is not null && input.OldPrice <= input.Price) Add("oldPrice", "Eski fiyat, fiyattan büyük olmalı.");
        if (!string.IsNullOrWhiteSpace(input.BadgeType) && !BadgeTypes.All.Contains(input.BadgeType.Trim()))
            Add("badgeType", "badgeType: sale, new veya info olmalı.");
        if (string.IsNullOrWhiteSpace(input.Category) || !await categories.ExistsAsync(input.Category, ct))
            Add("category", "Geçerli bir kategori seçin (GET /api/categories).");

        return errors;
    }
}
