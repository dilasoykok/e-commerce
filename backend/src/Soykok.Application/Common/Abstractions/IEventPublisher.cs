namespace Soykok.Application.Common.Abstractions;

/// <summary>
/// Diğer servislere giden olaylar (entegrasyon olayları). Uygulaması Infrastructure katmanındadır.
/// Yayın başarısız olursa loglanır; isteği düşürmez.
/// </summary>
public interface IEventPublisher
{
    Task PublishAsync<T>(string routingKey, T payload, CancellationToken ct = default) where T : notnull;
}
