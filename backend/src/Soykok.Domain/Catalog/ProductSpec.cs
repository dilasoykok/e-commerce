namespace Soykok.Domain.Catalog;

/// <summary>Ürün özellik satırı: "Kalınlık" → "8 mm". Sırası korunur.</summary>
public sealed record ProductSpec(string Label, string Value);
