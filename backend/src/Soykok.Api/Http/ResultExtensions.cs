using Soykok.Application.Common.Results;

namespace Soykok.Api.Http;

/// <summary>Application'dan dönen sonucu HTTP cevabına çevirir.</summary>
public static class ResultExtensions
{
    public static IResult ToHttp<T>(this Result<T> result, Func<T, IResult> onSuccess) =>
        result.IsSuccess ? onSuccess(result.Value) : result.Error!.ToProblem();

    public static IResult ToHttp(this Result result, Func<IResult> onSuccess) =>
        result.IsSuccess ? onSuccess() : result.Error!.ToProblem();

    public static IResult ToProblem(this Error error) => error.Type switch
    {
        ErrorType.Validation => Results.ValidationProblem(
            error.Fields?.ToDictionary(f => f.Key, f => f.Value) ?? new Dictionary<string, string[]>(),
            title: error.Message),
        ErrorType.NotFound => Results.Problem(title: error.Message, statusCode: StatusCodes.Status404NotFound,
            extensions: new Dictionary<string, object?> { ["code"] = error.Code }),
        ErrorType.Conflict => Results.Problem(title: error.Message, statusCode: StatusCodes.Status409Conflict,
            extensions: new Dictionary<string, object?> { ["code"] = error.Code }),
        _ => Results.Problem(statusCode: StatusCodes.Status500InternalServerError),
    };
}
