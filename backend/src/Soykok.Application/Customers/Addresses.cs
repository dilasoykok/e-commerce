using Soykok.Application.Common.Abstractions;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Application.Ordering.Contracts;
using Soykok.Domain.Common;
using Soykok.Domain.Customers;

namespace Soykok.Application.Customers;

/*
 * Adres defteri (Hesabım → Adreslerim).
 *   - Üye en fazla 10 teslimat adresi kaydeder; biri "varsayılan" olur (ilk eklenen otomatik)
 *   - Ödeme sayfasında kayıtlı adres tek tıkla forma doldurulur
 *   - Her işlem güncel listeyi döner: arayüz ayrıca sorgu atmaz
 */

/* ---------- Sözleşmeler ---------- */

public sealed record AddressDto(
    Guid Id, string Title, string RecipientName, string Phone,
    string City, string District, string Line, string? PostalCode, bool IsDefault)
{
    public static AddressDto From(CustomerAddress a) => new(
        a.Id, a.Title, a.RecipientName, a.Phone, a.Address.City, a.Address.District, a.Address.Line, a.Address.PostalCode, a.IsDefault);
}

public sealed record SaveAddressRequest(
    string? Title, string? RecipientName, string? Phone,
    string? City, string? District, string? Line, string? PostalCode, bool IsDefault);

public sealed record GetMyAddressesQuery(CurrentUser User);
public sealed record CreateAddressCommand(CurrentUser User, SaveAddressRequest Request);
public sealed record UpdateAddressCommand(CurrentUser User, Guid Id, SaveAddressRequest Request);
public sealed record DeleteAddressCommand(CurrentUser User, Guid Id);
public sealed record SetDefaultAddressCommand(CurrentUser User, Guid Id);

public static class AddressErrors
{
    public static Error NotFound() => Error.NotFound("addresses.not_found", "Adres bulunamadı.");
}

/* ---------- İş kuralları ---------- */

public sealed class AddressBookHandler(
    ICustomerRepository customers,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
    : IQueryHandler<GetMyAddressesQuery, IReadOnlyList<AddressDto>>,
      ICommandHandler<CreateAddressCommand, Result<IReadOnlyList<AddressDto>>>,
      ICommandHandler<UpdateAddressCommand, Result<IReadOnlyList<AddressDto>>>,
      ICommandHandler<DeleteAddressCommand, Result<IReadOnlyList<AddressDto>>>,
      ICommandHandler<SetDefaultAddressCommand, Result<IReadOnlyList<AddressDto>>>
{
    public async Task<IReadOnlyList<AddressDto>> HandleAsync(GetMyAddressesQuery query, CancellationToken ct)
    {
        var customer = await customers.FindWithAddressesAsync(query.User.IdentityId, ct);
        return customer is null ? [] : ToList(customer);
    }

    public async Task<Result<IReadOnlyList<AddressDto>>> HandleAsync(CreateAddressCommand command, CancellationToken ct)
    {
        if (Validate(command.Request) is { } invalid) return invalid;
        var v = Clean(command.Request);
        var now = clock.GetUtcNow();

        // Hiç sipariş vermemiş üyenin müşteri kaydı yok: giriş bilgileriyle oluştur
        var customer = await customers.FindWithAddressesAsync(command.User.IdentityId, ct);
        if (customer is null)
        {
            var user = command.User;
            var email = string.IsNullOrWhiteSpace(user.Email) ? $"{user.IdentityId}@uye.local" : user.Email;
            var first = string.IsNullOrWhiteSpace(user.FirstName) ? email.Split('@')[0] : user.FirstName;
            customer = Customer.Create(user.IdentityId, email, first, user.LastName, now);
            customers.Add(customer);
        }

        if (customer.Addresses.Count >= Customer.MaxAddresses)
            return Error.Validation(new Dictionary<string, string[]>
            {
                ["form"] = [$"En fazla {Customer.MaxAddresses} adres kaydedebilirsiniz. Önce kullanmadığınız bir adresi silin."],
            });

        customer.AddAddress(v.Title, v.Recipient, v.Phone, v.Address, null, v.IsDefault, now);
        await unitOfWork.SaveChangesAsync(ct);
        return Result<IReadOnlyList<AddressDto>>.Success(ToList(customer));
    }

    public async Task<Result<IReadOnlyList<AddressDto>>> HandleAsync(UpdateAddressCommand command, CancellationToken ct)
    {
        if (Validate(command.Request) is { } invalid) return invalid;
        var customer = await customers.FindWithAddressesAsync(command.User.IdentityId, ct);
        if (customer is null || customer.Addresses.All(a => a.Id != command.Id)) return AddressErrors.NotFound();

        var v = Clean(command.Request);
        customer.UpdateAddress(command.Id, v.Title, v.Recipient, v.Phone, v.Address, null, v.IsDefault, clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(ct);
        return Result<IReadOnlyList<AddressDto>>.Success(ToList(customer));
    }

    public async Task<Result<IReadOnlyList<AddressDto>>> HandleAsync(DeleteAddressCommand command, CancellationToken ct)
    {
        var customer = await customers.FindWithAddressesAsync(command.User.IdentityId, ct);
        if (customer is null || customer.Addresses.All(a => a.Id != command.Id)) return AddressErrors.NotFound();

        customer.RemoveAddress(command.Id, clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(ct);
        return Result<IReadOnlyList<AddressDto>>.Success(ToList(customer));
    }

    public async Task<Result<IReadOnlyList<AddressDto>>> HandleAsync(SetDefaultAddressCommand command, CancellationToken ct)
    {
        var customer = await customers.FindWithAddressesAsync(command.User.IdentityId, ct);
        if (customer is null || customer.Addresses.All(a => a.Id != command.Id)) return AddressErrors.NotFound();

        customer.SetDefaultAddress(command.Id);
        await unitOfWork.SaveChangesAsync(ct);
        return Result<IReadOnlyList<AddressDto>>.Success(ToList(customer));
    }

    /* ---------- Yardımcılar ---------- */

    /// <summary>Varsayılan adres en üstte, sonra eklenme sırasıyla</summary>
    private static IReadOnlyList<AddressDto> ToList(Customer c) =>
        c.Addresses.OrderByDescending(a => a.IsDefault).ThenBy(a => a.CreatedAt).Select(AddressDto.From).ToList();

    private sealed record CleanAddress(string Title, string Recipient, string Phone, PostalAddress Address, bool IsDefault);

    private static CleanAddress Clean(SaveAddressRequest r) => new(
        r.Title!.Trim(),
        r.RecipientName!.Trim(),
        NormalizePhone(r.Phone)!,
        new PostalAddress(r.City!.Trim(), r.District!.Trim(), r.Line!.Trim(), Digits(r.PostalCode) is { Length: > 0 } pc ? pc : null),
        r.IsDefault);

    private static Error? Validate(SaveAddressRequest r)
    {
        var errors = new Dictionary<string, string[]>();
        var title = r.Title?.Trim() ?? "";
        var recipient = r.RecipientName?.Trim() ?? "";
        var phone = NormalizePhone(r.Phone);
        var city = r.City?.Trim() ?? "";
        var district = r.District?.Trim() ?? "";
        var line = r.Line?.Trim() ?? "";
        var postal = Digits(r.PostalCode);

        if (title.Length is < 1 or > 30) errors["title"] = ["Adrese kısa bir ad verin (ör. Ev, İş, Şantiye)."];
        if (recipient.Length is < 3 or > 100) errors["recipientName"] = ["Teslim alacak kişinin adını ve soyadını yazın."];
        if (phone is null || phone.Length != 11 || !phone.StartsWith("05"))
            errors["phone"] = ["Cep telefonunu 05XX XXX XX XX biçiminde yazın."];
        if (city.Length is < 2 or > 64) errors["city"] = ["İl seçin."];
        if (district.Length is < 2 or > 64) errors["district"] = ["İlçeyi yazın."];
        if (line.Length is < 10 or > 500) errors["line"] = ["Mahalle, sokak, bina ve daire numarasını yazın."];
        if (postal.Length is not (0 or 5)) errors["postalCode"] = ["Posta kodu 5 haneli olmalı."];

        return errors.Count > 0 ? Error.Validation(errors) : null;
    }

    private static string Digits(string? value) => new((value ?? "").Where(char.IsDigit).ToArray());

    /// <summary>"0532 123 45 67", "+90 532..." → "05321234567"; boşsa null</summary>
    private static string? NormalizePhone(string? value)
    {
        var digits = Digits(value);
        if (digits.Length == 0) return null;
        if (digits.StartsWith("90") && digits.Length == 12) digits = digits[2..];
        if (digits.Length == 10) digits = "0" + digits;
        return digits;
    }
}
