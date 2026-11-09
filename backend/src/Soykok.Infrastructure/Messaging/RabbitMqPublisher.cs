using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using Soykok.Application.Common.Abstractions;

namespace Soykok.Infrastructure.Messaging;

public sealed class RabbitMqOptions
{
    public const string Section = "RabbitMQ";

    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 5672;
    public string Username { get; set; } = "guest";
    public string Password { get; set; } = "guest";
    public string VirtualHost { get; set; } = "/";
}

/// <summary>Olayları "soykok.events" topic exchange'ine yayınlar. Bağlantı ilk kullanımda açılır ve paylaşılır.</summary>
internal sealed class RabbitMqPublisher(IOptions<RabbitMqOptions> options, ILogger<RabbitMqPublisher> log)
    : IEventPublisher, IAsyncDisposable
{
    public const string Exchange = "soykok.events";

    private readonly ConnectionFactory _factory = new()
    {
        HostName = options.Value.Host,
        Port = options.Value.Port,
        UserName = options.Value.Username,
        Password = options.Value.Password,
        VirtualHost = options.Value.VirtualHost,
        ClientProvidedName = "soykok-api",
    };

    private readonly SemaphoreSlim _lock = new(1, 1);
    private IConnection? _connection;
    private IChannel? _channel;

    public async Task PublishAsync<T>(string routingKey, T payload, CancellationToken ct = default) where T : notnull
    {
        try
        {
            var channel = await GetChannelAsync(ct);
            var body = JsonSerializer.SerializeToUtf8Bytes(payload, JsonSerializerOptions.Web);
            var props = new BasicProperties
            {
                ContentType = "application/json",
                DeliveryMode = DeliveryModes.Persistent,
                MessageId = Guid.NewGuid().ToString("N"),
                Type = routingKey,
                Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds()),
            };

            await _lock.WaitAsync(ct);
            try
            {
                await channel.BasicPublishAsync(Exchange, routingKey, mandatory: false, basicProperties: props,
                    body: body, cancellationToken: ct);
            }
            finally
            {
                _lock.Release();
            }
        }
        catch (Exception ex)
        {
            log.LogError(ex, "RabbitMQ olayı yayınlanamadı: {RoutingKey}", routingKey);
        }
    }

    /// <summary>Health check için: bağlantı kurulabiliyor mu?</summary>
    public async Task<bool> PingAsync(CancellationToken ct = default)
    {
        try
        {
            await GetChannelAsync(ct);
            return true;
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "RabbitMQ'ya bağlanılamadı");
            return false;
        }
    }

    private async Task<IChannel> GetChannelAsync(CancellationToken ct)
    {
        if (_channel is { IsOpen: true })
            return _channel;

        await _lock.WaitAsync(ct);
        try
        {
            if (_channel is { IsOpen: true })
                return _channel;

            if (_connection is not { IsOpen: true })
            {
                if (_connection is not null)
                    await _connection.DisposeAsync();
                _connection = await _factory.CreateConnectionAsync(ct);
            }

            _channel = await _connection.CreateChannelAsync(cancellationToken: ct);
            await _channel.ExchangeDeclareAsync(Exchange, ExchangeType.Topic, durable: true, autoDelete: false,
                cancellationToken: ct);
            return _channel;
        }
        finally
        {
            _lock.Release();
        }
    }

    private bool _disposed;

    // Aynı nesne iki kayıtla (sınıf + IEventPublisher) çözüldüğü için iki kez çağrılabilir
    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        _disposed = true;

        if (_channel is not null) await _channel.DisposeAsync();
        if (_connection is not null) await _connection.DisposeAsync();
        _lock.Dispose();
    }
}
