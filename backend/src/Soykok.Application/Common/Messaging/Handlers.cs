namespace Soykok.Application.Common.Messaging;

/// <summary>Veri okuyan kullanım senaryosu (yan etkisi yok).</summary>
public interface IQueryHandler<in TQuery, TResult>
{
    Task<TResult> HandleAsync(TQuery query, CancellationToken ct);
}

/// <summary>Veri değiştiren kullanım senaryosu.</summary>
public interface ICommandHandler<in TCommand, TResult>
{
    Task<TResult> HandleAsync(TCommand command, CancellationToken ct);
}
