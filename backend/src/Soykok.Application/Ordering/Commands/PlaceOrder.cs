using System.Net.Mail;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Soykok.Application.Catalog;
using Soykok.Application.Common.Abstractions;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Application.Ordering.Admin;
using Soykok.Application.Ordering.Contracts;
using Soykok.Domain.Common;
using Soykok.Domain.Customers;
using Soykok.Domain.Ordering;

namespace Soykok.Application.Ordering.Commands;

/// <param name="ClientIp">Müşterinin IP adresi (ödeme kuruluşu dolandırıcılık kontrolü için ister)</param>
public sealed record PlaceOrderCommand(PlaceOrderRequest Request, CurrentUser? User, string ClientIp = "127.0.0.1");

/// <summary>
/// Sipariş oluşturma:
///  1. Form doğrulanır (alan bazlı hatalar)
///  2. Ürünler ve FİYATLAR veritabanından okunur — tarayıcıdan gelen fiyata güvenilmez
///  3. Kargo ücreti sunucuda hesaplanır
///  4. Tek transaction içinde: stok düşülür (yetersizse hiçbir şey kaydedilmez) + sipariş kaydedilir
///  5. Giriş yapmış kullanıcı müşteri kaydına bağlanır (yoksa oluşturulur)
///  6. order.created olayı yayınlanır
/// Sipariş "Ödeme Bekleniyor" durumunda açılır. Kartla ödemede iyzico ödeme sayfası açılır ve
/// adresi cevapta (paymentPageUrl) döner; ödeme sonucu CompleteCardPaymentHandler'da işlenir.
/// </summary>
public sealed partial class PlaceOrderHandler(
    IProductRepository products,
    IOrderRepository orders,
    ICustomerRepository customers,
    IStockReservation stock,
    IUnitOfWork unitOfWork,
    CatalogSnapshotProvider catalog,
    IEventPublisher events,
    IPaymentGateway payments,
    ICommandHandler<ChangeOrderStatusCommand, Result<AdminOrderDetail>> changeStatus,
    TimeProvider clock,
    ILogger<PlaceOrderHandler> log) : ICommandHandler<PlaceOrderCommand, Result<OrderDetail>>
{
    public const int MaxLines = 50;

    public async Task<Result<OrderDetail>> HandleAsync(PlaceOrderCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var errors = Validate(r);

        // Aynı ürün iki kez geldiyse birleştir
        var quantities = (r.Items ?? [])
            .Where(i => !string.IsNullOrWhiteSpace(i.ProductId))
            .GroupBy(i => i.ProductId.Trim())
            .ToDictionary(g => g.Key, g => g.Sum(i => i.Quantity));

        if (quantities.Count == 0) errors["items"] = ["Sepetiniz boş."];
        else if (quantities.Count > MaxLines) errors["items"] = [$"Bir siparişte en fazla {MaxLines} farklı ürün olabilir."];
        else if (quantities.Values.Any(q => q is <= 0 or > OrderItem.MaxQuantity))
            errors["items"] = [$"Ürün adedi 1 ile {OrderItem.MaxQuantity} arasında olmalı."];

        if (r.Payment == "card" && !payments.IsEnabled)
            errors["payment"] = ["Kartla ödeme şu anda kullanılamıyor. Lütfen Havale / EFT seçin."];

        if (errors.Count > 0) return OrderingErrors.Validation(errors);

        // Ürünler ve güncel fiyatlar
        var found = (await products.GetByIdsAsync(quantities.Keys.ToList(), ct)).ToDictionary(p => p.Id);
        var missing = quantities.Keys.Where(id => !found.ContainsKey(id)).ToList();
        if (missing.Count > 0)
            return OrderingErrors.Validation(new()
            {
                ["items"] = [$"Sepetinizdeki bazı ürünler artık satışta değil ({string.Join(", ", missing)}). Lütfen sepetinizi güncelleyin."],
            });

        var lines = quantities
            .Select(kv =>
            {
                var p = found[kv.Key];
                return new OrderLine(p.Id, p.Name, p.Brand, p.Image, p.Unit, p.Price, kv.Value);
            })
            .ToList();

        var subtotal = lines.Sum(l => l.UnitPrice * l.Quantity);
        var delivery = r.Delivery == "store" ? DeliveryMethod.Store : DeliveryMethod.Cargo;
        var payment = r.Payment == "transfer" ? PaymentMethod.Transfer : PaymentMethod.Card;
        var now = clock.GetUtcNow();

        var buyer = new BuyerInfo(r.Email!, r.FirstName!, r.LastName!, NormalizePhone(r.Phone!));
        var address = delivery == DeliveryMethod.Cargo
            ? new PostalAddress(r.City!, r.District!, r.Address!, r.PostalCode)
            : null;
        var invoice = r.InvoiceType == "corporate"
            ? new InvoiceInfo(InvoiceType.Corporate, r.CompanyName, r.TaxOffice, r.TaxNumber)
            : new InvoiceInfo(InvoiceType.Individual);

        // Üye ise müşteri kaydı (ilk siparişte oluşturulur)
        Guid? customerId = null;
        if (command.User is { } user)
        {
            var customer = await customers.FindByIdentityIdAsync(user.IdentityId, ct);
            if (customer is null)
            {
                customer = Customer.Create(
                    user.IdentityId,
                    string.IsNullOrWhiteSpace(user.Email) ? buyer.Email : user.Email,
                    string.IsNullOrWhiteSpace(user.FirstName) ? buyer.FirstName : user.FirstName,
                    string.IsNullOrWhiteSpace(user.LastName) ? buyer.LastName : user.LastName,
                    now);
                customers.Add(customer);
            }
            customerId = customer.Id;
        }

        var number = await NewOrderNumberAsync(now, ct);
        var order = Order.Place(
            number, customerId, buyer, delivery, address, r.Note, invoice, payment, r.Marketing,
            lines, ShippingPolicy.FeeFor(subtotal), now);

        // Stok + sipariş tek transaction'da: biri olmazsa ikisi de olmaz
        var shortages = await unitOfWork.ExecuteInTransactionAsync(async tct =>
        {
            var shortage = await stock.TryReserveAsync(quantities, now, tct);
            if (shortage.Count > 0) return (shortage, false); // geri al: düşülen stoklar da geri gelir

            // "Çok Satanlar" sıralaması için satış adedini artır
            foreach (var line in lines)
            {
                var p = found[line.ProductId];
                p.SetStatistics(p.Rating, p.Reviews, p.Sales + line.Quantity);
            }

            orders.Add(order);
            await unitOfWork.SaveChangesAsync(tct);
            return (shortage, true);
        }, ct);

        if (shortages.Count > 0)
            return OrderingErrors.OutOfStock(shortages.Select(s =>
                $"{found[s.ProductId].Name} (en fazla {s.Available} {found[s.ProductId].Unit ?? "adet"})"));

        log.LogInformation("Sipariş oluşturuldu: {Number} ({Total} TL, {Lines} kalem)", order.Number, order.Total, lines.Count);

        await catalog.InvalidateAsync(ct); // satış adetleri değişti
        await events.PublishAsync(OrderingEvents.OrderCreated, new OrderCreatedEvent(
            order.Id, order.Number, order.CustomerId, order.Buyer.Email, order.Total,
            OrderingNames.Of(order.PaymentMethod), OrderingNames.Of(order.DeliveryMethod),
            order.Items.Select(OrderItemDto.From).ToList(), order.PlacedAt), ct);

        var detail = OrderDetail.From(order, includePersonal: true);
        if (payment != PaymentMethod.Card) return detail;

        // Kartla ödeme: iyzico ödeme sayfasını aç
        PaymentSession session;
        try
        {
            session = await payments.StartCheckoutAsync(order, command.ClientIp, ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            log.LogError(ex, "Ödeme sayfası açılamadı: {Number}", order.Number);
            session = new PaymentSession(false, null, null);
        }

        if (session is { Success: true, PaymentPageUrl: { } url })
        {
            // Müşteri ödeme sayfasını yarıda bırakırsa PendingCardPaymentsHandler bu token'la sonucu sorar
            if (session.Token is { Length: > 0 } token)
            {
                order.SetPaymentToken(token);
                await unitOfWork.SaveChangesAsync(ct);
            }
            return detail with { PaymentPageUrl = url };
        }

        // Ödeme başlatılamadıysa sipariş iptal, stok geri: müşteri sepetinden tekrar deneyebilir
        await changeStatus.HandleAsync(new ChangeOrderStatusCommand(
            order.Number, "cancelled", $"Ödeme sayfası açılamadı: {session.ErrorMessage ?? "bağlantı hatası"}", "iyzico"), ct);
        return OrderingErrors.PaymentUnavailable(session.ErrorMessage);
    }

    /* ---------- Doğrulama ---------- */

    private static Dictionary<string, string[]> Validate(PlaceOrderRequest r)
    {
        var errors = new Dictionary<string, string[]>();
        void Add(string field, string message) => errors[field] = [message];
        bool Empty(string? s) => string.IsNullOrWhiteSpace(s);

        if (Empty(r.FirstName)) Add("firstName", "Adınızı girin.");
        else if (r.FirstName!.Trim().Length > 100) Add("firstName", "Ad en fazla 100 karakter olabilir.");
        if (Empty(r.LastName)) Add("lastName", "Soyadınızı girin.");
        else if (r.LastName!.Trim().Length > 100) Add("lastName", "Soyad en fazla 100 karakter olabilir.");
        if (Empty(r.Email) || !IsEmail(r.Email!)) Add("email", "Geçerli bir e-posta adresi girin.");
        if (Empty(r.Phone) || !PhoneRegex().IsMatch(NormalizePhone(r.Phone!)))
            Add("phone", "Geçerli bir cep telefonu girin (ör. 0532 123 45 67).");

        if (r.Delivery is not ("cargo" or "store")) Add("delivery", "Teslimat yöntemi seçin.");
        if (r.Delivery == "cargo")
        {
            if (Empty(r.City)) Add("city", "İl seçin.");
            if (Empty(r.District)) Add("district", "İlçe girin.");
            if (Empty(r.Address)) Add("address", "Açık adresinizi girin.");
            else if (r.Address!.Trim().Length is < 10 or > 500) Add("address", "Adres 10 ile 500 karakter arasında olmalı.");
            if (!Empty(r.PostalCode) && !PostalCodeRegex().IsMatch(r.PostalCode!.Trim()))
                Add("postalCode", "Posta kodu 5 haneli olmalı.");
        }
        if (r.Note is { Length: > 500 }) Add("note", "Not en fazla 500 karakter olabilir.");

        if (r.InvoiceType is not ("individual" or "corporate")) Add("invoiceType", "Fatura tipi seçin.");
        if (r.InvoiceType == "corporate")
        {
            if (Empty(r.CompanyName)) Add("companyName", "Firma adını girin.");
            if (Empty(r.TaxOffice)) Add("taxOffice", "Vergi dairesini girin.");
            if (Empty(r.TaxNumber) || !TaxNumberRegex().IsMatch(r.TaxNumber!.Trim()))
                Add("taxNumber", "Vergi numarası 10, T.C. kimlik numarası 11 haneli olmalı.");
        }

        if (r.Payment is not ("card" or "transfer")) Add("payment", "Ödeme yöntemi seçin.");
        if (!r.Terms) Add("terms", "Devam etmek için sözleşmeleri onaylayın.");
        return errors;
    }

    private static bool IsEmail(string s) =>
        s.Length <= 256 && MailAddress.TryCreate(s.Trim(), out var m) && m.Address == s.Trim() && s.Contains('.');

    /// <summary>"+90 (532) 123 45 67" → "05321234567"</summary>
    private static string NormalizePhone(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("90") && digits.Length == 12) digits = "0" + digits[2..];
        if (digits.Length == 10) digits = "0" + digits;
        return digits;
    }

    [GeneratedRegex(@"^05\d{9}$")]
    private static partial Regex PhoneRegex();

    [GeneratedRegex(@"^\d{5}$")]
    private static partial Regex PostalCodeRegex();

    [GeneratedRegex(@"^\d{10,11}$")]
    private static partial Regex TaxNumberRegex();

    /* ---------- Sipariş numarası: SYK-261110-4821 ---------- */

    private async Task<string> NewOrderNumberAsync(DateTimeOffset now, CancellationToken ct)
    {
        var day = now.ToOffset(TimeSpan.FromHours(3)).ToString("yyMMdd"); // Türkiye saatiyle
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var number = $"SYK-{day}-{RandomNumberGenerator.GetInt32(1000, 10000)}";
            if (!await orders.NumberExistsAsync(number, ct)) return number;
        }
        // Günde ~9000 siparişe yaklaşılırsa daha uzun numara
        return $"SYK-{day}-{RandomNumberGenerator.GetInt32(100000, 1000000)}";
    }
}
