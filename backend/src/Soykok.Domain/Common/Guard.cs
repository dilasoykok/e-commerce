namespace Soykok.Domain.Common;

internal static class Guard
{
    public static string NotEmpty(string? value, string field) =>
        string.IsNullOrWhiteSpace(value) ? throw new DomainException($"{field} boş olamaz.") : value.Trim();

    public static string? TrimToNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
