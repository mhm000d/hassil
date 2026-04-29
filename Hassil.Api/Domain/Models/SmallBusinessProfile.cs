using Hassil.Api.Domain.Enums;

namespace Hassil.Api.Domain.Models;

public class SmallBusinessProfile
{
    public Guid UserId { get; private set; }
    public string BusinessName { get; private set; } = null!;
    public string RegistrationNumber { get; private set; } = null!;
    public string? BusinessBankAccountName { get; private set; }
    public string? BusinessBankAccountLast4 { get; private set; }
    public VerificationStatus VerificationStatus { get; private set; }

    // Navigation Properties
    public User User { get; private set; } = null!;

    // Factory
    public static SmallBusinessProfile Create(
        Guid userId,
        string businessName,
        string registrationNumber,
        string? businessBankAccountName = null,
        string? businessBankAccountLast4 = null)
    {
        return new SmallBusinessProfile
        {
            UserId = userId,
            BusinessName = Required(businessName, nameof(businessName)),
            RegistrationNumber = Required(registrationNumber, nameof(registrationNumber)),
            BusinessBankAccountName = Optional(businessBankAccountName),
            BusinessBankAccountLast4 = Optional(businessBankAccountLast4),
            VerificationStatus = VerificationStatus.Verified
        };
    }

    // State Machine
    public void MarkVerified()
    {
        VerificationStatus = VerificationStatus.Verified;
    }

    public void Reject()
    {
        VerificationStatus = VerificationStatus.Rejected;
    }

    public void UpdateBusinessDetails(string businessName, string registrationNumber)
    {
        BusinessName = Required(businessName, nameof(businessName));
        RegistrationNumber = Required(registrationNumber, nameof(registrationNumber));
    }

    public void UpdateBankAccount(string? accountName, string? accountLast4)
    {
        BusinessBankAccountName = Optional(accountName);
        BusinessBankAccountLast4 = Optional(accountLast4);
    }

    // Helpers
    private static string Required(string value, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException($"{parameterName} is required.", parameterName);

        return value.Trim();
    }

    private static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
