using Microsoft.Extensions.Options;
using Soykok.Api.Uploads;
using Soykok.Infrastructure.Identity;

namespace Soykok.Api.Endpoints;

/// <summary>
/// Görsel yükleme (yalnızca admin).
///   POST /api/admin/uploads              (multipart/form-data, alan adı: file) → { url: "/api/files/products/0193....jpg" }
///   POST /api/admin/uploads?klasor=brands → marka logosu: { url: "/api/files/brands/0193....png" }
/// Dönen adres ürünün "image" / "images" alanına ya da markanın logoUrl alanına yazılır. Dosyalar UploadOptions.RootPath altında
/// saklanır ve /api/files/... adresinden sunulur (Program.cs → UseStaticFiles).
/// </summary>
public static class AdminUploadEndpoints
{
    /// <summary>İzin verilen klasörler (adres çubuğundan gelen değer yalnızca bunlardan biri olabilir)</summary>
    private static readonly string[] Folders = ["products", "brands"];

    public static RouteGroupBuilder MapAdminUploadEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/admin/uploads", Upload)
            .WithTags("Admin")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .DisableAntiforgery(); // çerez SameSite=Lax: başka siteden gelen form gönderimine çerez eklenmez
        return api;
    }

    private static async Task<IResult> Upload(HttpRequest request, IOptions<UploadOptions> options, ILoggerFactory logs, CancellationToken ct)
    {
        var o = options.Value;
        static IResult Invalid(string message) =>
            Results.ValidationProblem(new Dictionary<string, string[]> { ["file"] = [message] });

        if (!request.HasFormContentType) return Invalid("Dosya seçin.");
        var form = await request.ReadFormAsync(ct);
        var file = form.Files.GetFile("file");
        if (file is null || file.Length == 0) return Invalid("Dosya seçin.");
        if (file.Length > o.MaxBytes) return Invalid($"Dosya en fazla {o.MaxBytes / 1024 / 1024} MB olabilir.");

        // Uzantıya değil dosyanın ilk baytlarına bakılır (yeniden adlandırılmış dosya geçemez)
        var header = new byte[12];
        await using (var peek = file.OpenReadStream())
            await peek.ReadAtLeastAsync(header, header.Length, throwOnEndOfStream: false, ct);
        var ext = DetectImage(header);
        if (ext is null) return Invalid("Yalnızca JPG, PNG veya WEBP görsel yüklenebilir.");

        var requested = request.Query["klasor"].ToString();
        var folder = string.IsNullOrEmpty(requested) ? Folders[0] : Folders.FirstOrDefault(f => f == requested);
        if (folder is null) return Invalid("Geçersiz klasör.");

        var dir = Path.Combine(o.RootPath, folder);
        Directory.CreateDirectory(dir);
        var name = $"{Guid.CreateVersion7():N}{ext}";
        await using (var target = File.Create(Path.Combine(dir, name)))
        await using (var source = file.OpenReadStream())
            await source.CopyToAsync(target, ct);

        logs.CreateLogger("Uploads").LogInformation("Görsel yüklendi: {Name} ({Bytes} bayt)", name, file.Length);
        return Results.Ok(new { url = $"{UploadOptions.RequestPath}/{folder}/{name}" });
    }

    private static string? DetectImage(ReadOnlySpan<byte> h)
    {
        if (h is [0xFF, 0xD8, 0xFF, ..]) return ".jpg";
        if (h is [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, ..]) return ".png";
        if (h.Length >= 12 && h[..4].SequenceEqual("RIFF"u8) && h[8..12].SequenceEqual("WEBP"u8)) return ".webp";
        return null;
    }
}
