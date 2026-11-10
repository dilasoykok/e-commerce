using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Soykok.Application.Common.Abstractions;
using Soykok.Application.Ordering.Admin;
using Soykok.Application.Ordering.Contracts;
using Soykok.Domain.Ordering;
using Soykok.Infrastructure.Messaging;

namespace Soykok.Infrastructure.Notifications;

/// <summary>
/// Sipariş e-postaları. RabbitMQ'daki "soykok.order-emails" kuyruğunu dinler
/// (order.created, order.status_changed) ve müşteriye / admin'e e-posta gönderir.
///
///   Havale siparişi verildi   → müşteri: "siparişiniz alındı + IBAN", admin: yeni sipariş
///   Kartla ödeme onaylandı    → müşteri: "siparişiniz alındı",          admin: yeni sipariş
///   Havale onaylandı          → müşteri: "ödemeniz alındı"
///   Hazırlanıyor / Kargoda / Teslim / İptal → müşteri bilgilendirme
///
/// Kart ödemesi tamamlanmadığı için iptal edilen siparişe mail atılmaz (müşteri sonucu sitede gördü).
/// SMTP ayarı yoksa servis hiç başlamaz. Gönderilemeyen mail bir kez yeniden denenir.
/// </summary>
internal sealed class OrderEmailWorker(
    IOptions<RabbitMqOptions> mqOptions,
    IOptions<EmailOptions> emailOptions,
    SmtpEmailSender sender,
    IServiceScopeFactory scopes,
    ILogger<OrderEmailWorker> log) : BackgroundService
{
    private const string Queue = "soykok.order-emails";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!sender.IsEnabled)
        {
            log.LogInformation("E-posta ayarı yok (SMTP_HOST / SMTP_FROM); sipariş e-postaları gönderilmeyecek.");
            return;
        }

        // Bağlantı koparsa (RabbitMQ yeniden başladı vb.) 10 sn sonra tekrar bağlan
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ConsumeAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                log.LogWarning(ex, "E-posta kuyruğu dinlenemedi; 10 sn sonra yeniden denenecek.");
            }

            try { await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken); }
            catch (OperationCanceledException) { break; }
        }
    }

    private async Task ConsumeAsync(CancellationToken ct)
    {
        var mq = mqOptions.Value;
        var factory = new ConnectionFactory
        {
            HostName = mq.Host,
            Port = mq.Port,
            UserName = mq.Username,
            Password = mq.Password,
            VirtualHost = mq.VirtualHost,
            ClientProvidedName = "soykok-api-emails",
        };

        await using var connection = await factory.CreateConnectionAsync(ct);
        await using var channel = await connection.CreateChannelAsync(cancellationToken: ct);

        await channel.ExchangeDeclareAsync(RabbitMqPublisher.Exchange, ExchangeType.Topic, durable: true, autoDelete: false,
            cancellationToken: ct);
        await channel.QueueDeclareAsync(Queue, durable: true, exclusive: false, autoDelete: false, cancellationToken: ct);
        await channel.QueueBindAsync(Queue, RabbitMqPublisher.Exchange, OrderingEvents.OrderCreated, cancellationToken: ct);
        await channel.QueueBindAsync(Queue, RabbitMqPublisher.Exchange, AdminOrderEvents.StatusChanged, cancellationToken: ct);
        await channel.BasicQosAsync(prefetchSize: 0, prefetchCount: 1, global: false, cancellationToken: ct);

        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.ReceivedAsync += async (_, ea) =>
        {
            try
            {
                await HandleAsync(ea.RoutingKey, ea.Body, ct);
                await channel.BasicAckAsync(ea.DeliveryTag, multiple: false, cancellationToken: ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // İlk hatada kuyruğa geri koy (bir kez daha denensin), ikincide bırak
                log.LogError(ex, "Sipariş e-postası gönderilemedi ({RoutingKey}, tekrar: {Redelivered})", ea.RoutingKey, ea.Redelivered);
                await channel.BasicNackAsync(ea.DeliveryTag, multiple: false, requeue: !ea.Redelivered, cancellationToken: ct);
            }
        };

        var closed = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        connection.ConnectionShutdownAsync += (_, _) =>
        {
            closed.TrySetResult();
            return Task.CompletedTask;
        };

        await channel.BasicConsumeAsync(Queue, autoAck: false, consumer: consumer, cancellationToken: ct);
        log.LogInformation("Sipariş e-postaları kuyruğu dinleniyor ({Queue}).", Queue);

        await using var registration = ct.Register(() => closed.TrySetResult());
        await closed.Task;
        ct.ThrowIfCancellationRequested();
    }

    private async Task HandleAsync(string routingKey, ReadOnlyMemory<byte> body, CancellationToken ct)
    {
        var settings = emailOptions.Value;
        await using var scope = scopes.CreateAsyncScope();
        var orders = scope.ServiceProvider.GetRequiredService<IOrderRepository>();

        if (routingKey == OrderingEvents.OrderCreated)
        {
            var e = JsonSerializer.Deserialize<OrderCreatedEvent>(body.Span, JsonSerializerOptions.Web);
            if (e is null) return;
            // Kartla ödemede mail, ödeme onaylanınca (status_changed → received) gider
            if (e.PaymentMethod != OrderingNames.Of(PaymentMethod.Transfer)) return;

            var order = await orders.FindByNumberAsync(e.Number, ct);
            if (order is null) return;
            await SendAsync(OrderEmailTemplates.TransferReceived(order, settings), ct);
            await NotifyAdminAsync(order, settings, ct);
            return;
        }

        if (routingKey == AdminOrderEvents.StatusChanged)
        {
            var e = JsonSerializer.Deserialize<OrderStatusChangedEvent>(body.Span, JsonSerializerOptions.Web);
            if (e is null) return;
            var order = await orders.FindByNumberAsync(e.Number, ct);
            if (order is null) return;

            var from = Parse(e.From);
            var to = Parse(e.To);
            var card = order.PaymentMethod == PaymentMethod.Card;

            switch (to)
            {
                case OrderStatus.Received when from == OrderStatus.AwaitingPayment:
                    await SendAsync(OrderEmailTemplates.PaymentConfirmed(order, settings, card), ct);
                    if (card) await NotifyAdminAsync(order, settings, ct); // havalede admin'e sipariş anında gitmişti
                    break;
                case OrderStatus.Preparing:
                    await SendAsync(OrderEmailTemplates.Preparing(order, settings), ct);
                    break;
                case OrderStatus.Shipped:
                    await SendAsync(OrderEmailTemplates.Shipped(order, settings), ct);
                    break;
                case OrderStatus.Delivered:
                    await SendAsync(OrderEmailTemplates.Delivered(order, settings), ct);
                    break;
                case OrderStatus.Cancelled when !(card && from == OrderStatus.AwaitingPayment):
                    await SendAsync(OrderEmailTemplates.Cancelled(order, settings, e.Note), ct);
                    break;
            }
        }
    }

    private async Task NotifyAdminAsync(Order order, EmailOptions settings, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(settings.AdminAddress)) return;
        await SendAsync(OrderEmailTemplates.NewOrderForAdmin(order, settings, settings.AdminAddress), ct);
    }

    private async Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        await sender.SendAsync(message, ct);
        log.LogInformation("E-posta gönderildi: {Subject} → {To}", message.Subject, message.To);
    }

    private static OrderStatus? Parse(string? status) =>
        Enum.TryParse<OrderStatus>(status, ignoreCase: true, out var s) ? s : null;
}
