namespace Soykok.Application.Common.Results;

public enum ErrorType
{
    Validation,
    NotFound,
    Conflict,
}

/// <summary>Beklenen (iş akışına ait) hata. Beklenmeyen hatalar exception olarak kalır.</summary>
public sealed record Error(
    string Code,
    string Message,
    ErrorType Type,
    IReadOnlyDictionary<string, string[]>? Fields = null)
{
    public static Error NotFound(string code, string message) => new(code, message, ErrorType.NotFound);
    public static Error Conflict(string code, string message) => new(code, message, ErrorType.Conflict);

    public static Error Validation(IReadOnlyDictionary<string, string[]> fields) =>
        new("validation", "Gönderilen bilgilerde hata var.", ErrorType.Validation, fields);
}

/// <summary>Değer döndürmeyen işlemin sonucu.</summary>
public class Result
{
    protected Result(Error? error) => Error = error;

    public Error? Error { get; }
    public bool IsSuccess => Error is null;

    public static Result Success() => new(null);
    public static Result Failure(Error error) => new(error);

    public static implicit operator Result(Error error) => Failure(error);
}

/// <summary>Başarılıysa değer, başarısızsa <see cref="Error"/> taşır.</summary>
public sealed class Result<T> : Result
{
    private readonly T? _value;

    private Result(T value) : base(null) => _value = value;
    private Result(Error error, bool _) : base(error) { }

    public T Value => IsSuccess ? _value! : throw new InvalidOperationException("Başarısız sonucun değeri yok.");

    public static Result<T> Success(T value) => new(value);
    public static new Result<T> Failure(Error error) => new(error, false);

    public static implicit operator Result<T>(T value) => Success(value);
    public static implicit operator Result<T>(Error error) => Failure(error);
}
