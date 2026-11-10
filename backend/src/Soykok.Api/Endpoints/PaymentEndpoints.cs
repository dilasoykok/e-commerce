using Soykok.Application.Common.Messaging;
using Soykok.Application.Payments;

namespace Soykok.Api.Endpoints;

/// <summary>
/// Ödeme kuruluşu geri dönüşleri.
///   POST /api/payments/iyzico/callback?no=SYK-...   (form alanı: token)
/// iyzico ödeme bitince müşterinin TARAYICISINI bu adrese POST eder; biz sonucu iyzico'dan
/// doğrulayıp tarayıcıyı sitedeki sonuç sayfasına yönlendiririz.
/// </summary>
public static class PaymentEndpoints
{
    public static RouteGroupBuilder MapPaymentEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/payments/iyzico/callback", IyzicoCallback)
            .WithTags("Payments")
            .AllowAnonymous()
            .DisableAntiforgery()   // başka siteden (iyzico) gelen form gönderimi
            .ExcludeFromDescription();
        return api;
    }

    private static async Task<IResult> IyzicoCallback(
        HttpRequest request,
        ICommandHandler<CompleteCardPaymentCommand, CardPaymentResult> handler,
        CancellationToken ct)
    {
        string? token = null;
        if (request.HasFormContentType)
            token = (await request.ReadFormAsync(ct))["token"].ToString();

        var result = await handler.HandleAsync(new CompleteCardPaymentCommand(token, request.Query["no"].ToString()), ct);

        // Göreli adres: tarayıcı aynı alan adında (nginx) sonuç sayfasını açar
        if (result.Success)
            return Results.Redirect($"/siparis-tamamlandi?no={Uri.EscapeDataString(result.OrderNumber!)}&odeme=basarili");

        var query = "odeme=basarisiz";
        if (result.OrderNumber is { } no) query += "&no=" + Uri.EscapeDataString(no);
        if (!string.IsNullOrWhiteSpace(result.Message)) query += "&mesaj=" + Uri.EscapeDataString(result.Message);
        return Results.Redirect("/odeme?" + query);
    }
}
