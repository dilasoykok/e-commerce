using Soykok.Application.Common.Abstractions;
using Soykok.Application.Common.Messaging;
using Soykok.Application.Common.Results;
using Soykok.Application.Ordering.Contracts;
using Soykok.Domain.Customers;

namespace Soykok.Application.Customers;

/* ---------- Sözleşmeler: API'ye giren ve çıkan veriler ---------- */

public sealed record ProfileDto(string Email, string FirstName, string LastName, string? Phone, bool MarketingConsent);

public sealed record UpdateProfileRequest(string? FirstName, string? LastName, string? Phone, bool MarketingConsent);

public sealed record GetMyProfileQuery(CurrentUser User);
public sealed record UpdateMyProfileCommand(CurrentUser User, UpdateProfileRequest Request);

/* ---------- İş kuralları ---------- */

public sealed class ProfileHandler(
    ICustomerRepository customers,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
    : IQueryHandler<GetMyProfileQuery, ProfileDto>,
      ICommandHandler<UpdateMyProfileCommand, Result<ProfileDto>>
{
    public async Task<ProfileDto> HandleAsync(GetMyProfileQuery query, CancellationToken ct)
    {
        var customer = await customers.FindByIdentityIdAsync(query.User.IdentityId, ct);

        // Henüz hiç sipariş/yorum vermemiş üyenin kaydı yok: Keycloak'taki bilgileri göster
        if (customer is null)
            return new ProfileDto(query.User.Email, query.User.FirstName, query.User.LastName, null, false);

        return ToDto(customer);
    }

    public async Task<Result<ProfileDto>> HandleAsync(UpdateMyProfileCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var first = r.FirstName?.Trim() ?? "";
        var last = r.LastName?.Trim() ?? "";
        var phone = NormalizePhone(r.Phone);

        // 1) Gelen bilgileri kontrol et
        var errors = new Dictionary<string, string[]>();
        if (first.Length is < 2 or > 50) errors["firstName"] = ["Adınızı yazın (2-50 karakter)."];
        if (last.Length is < 2 or > 50) errors["lastName"] = ["Soyadınızı yazın (2-50 karakter)."];
        if (phone is not null && !IsMobile(phone)) errors["phone"] = ["Cep telefonunu 05XX XXX XX XX biçiminde yazın."];
        if (errors.Count > 0) return Error.Validation(errors);

        // 2) Müşteri kaydını bul, yoksa oluştur
        var now = clock.GetUtcNow();
        var user = command.User;
        var customer = await customers.FindByIdentityIdAsync(user.IdentityId, ct);
        if (customer is null)
        {
            var email = string.IsNullOrWhiteSpace(user.Email) ? $"{user.IdentityId}@uye.local" : user.Email;
            customer = Customer.Create(user.IdentityId, email, first, last, now);
            customers.Add(customer);
        }

        // 3) Güncelle ve kaydet
        customer.UpdateProfile(first, last, phone, r.MarketingConsent, now);
        await unitOfWork.SaveChangesAsync(ct);
        return ToDto(customer);
    }

    private static ProfileDto ToDto(Customer c) =>
        new(c.Email, c.FirstName, c.LastName, c.Phone, c.MarketingConsent);

    /// <summary>"0532 123 45 67", "+90 532..." → "05321234567"; boşsa null</summary>
    private static string? NormalizePhone(string? value)
    {
        var digits = new string((value ?? "").Where(char.IsDigit).ToArray());
        if (digits.Length == 0) return null;
        if (digits.StartsWith("90") && digits.Length == 12) digits = digits[2..];
        if (digits.Length == 10) digits = "0" + digits;
        return digits;
    }

    private static bool IsMobile(string phone) => phone.Length == 11 && phone.StartsWith("05");
}
