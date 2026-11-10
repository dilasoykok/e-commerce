namespace Soykok.Api.Uploads;

/// <summary>Admin panelinden yüklenen dosyalar (appsettings "Uploads"; docker'da "uploads" volume'u).</summary>
public sealed class UploadOptions
{
    public const string Section = "Uploads";

    /// <summary>Dosyaların yazıldığı klasör. Docker: /app/data/uploads (kalıcı volume)</summary>
    public string RootPath { get; set; } = Path.Combine(AppContext.BaseDirectory, "data", "uploads");

    /// <summary>Tarayıcının dosyaları istediği adres: /api/files/products/xxx.jpg</summary>
    public const string RequestPath = "/api/files";

    public long MaxBytes { get; set; } = 5 * 1024 * 1024;
}
