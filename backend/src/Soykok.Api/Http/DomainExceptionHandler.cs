using Microsoft.AspNetCore.Diagnostics;
using Soykok.Domain.Common;

namespace Soykok.Api.Http;

/// <summary>İş kuralı ihlallerini (DomainException) 400 Bad Request olarak döndürür.</summary>
public sealed class DomainExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext http, Exception exception, CancellationToken ct)
    {
        if (exception is not DomainException domain)
            return false;

        await Results.Problem(title: domain.Message, statusCode: StatusCodes.Status400BadRequest)
            .ExecuteAsync(http);
        return true;
    }
}
