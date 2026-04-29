using Hassil.Api.Domain.Enums;

namespace Hassil.Api.Domain.Models;

public class FreelancerProfile
{
    public Guid UserId { get; private set; }
    public string FullName { get; private set; } = null!;
    public string? PersonalBankAccountName { get; private set; }
    public string? PersonalBankAccountLast4 { get; private set; }
    public VerificationStatus VerificationStatus { get; private set; }

    // Navigation Properties
    public User User { get; private set; } = null!;

    // Factory
    public static FreelancerProfile Create(
        Guid userId,
        string fullName,
        string? personalBankAccountName = null,
        string? personalBankAccountLast4 = null)
    {
        return new FreelancerProfile
        {
            UserId = userId,
            FullName = Required(fullName, nameof(fullName)),
            PersonalBankAccountName = Optional(personalBankAccountName),
            PersonalBankAccountLast4 = Optional(personalBankAccountLast4),
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

    public void UpdateProfile(string fullName)
    {
        FullName = Required(fullName, nameof(fullName));
    }

    public void UpdateBankAccount(string? accountName, string? accountLast4)
    {
        PersonalBankAccountName = Optional(accountName);
        PersonalBankAccountLast4 = Optional(accountLast4);
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
