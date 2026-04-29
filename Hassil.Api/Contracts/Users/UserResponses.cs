namespace Hassil.Api.Contracts.Users;

public record UserResponse(
    Guid Id,
    string AccountType,
    string Role,
    string Email,
    string? Phone,
    string? Country,
    int TrustScore,
    string Status,
    SmallBusinessProfileResponse? SmallBusinessProfile,
    FreelancerProfileResponse? FreelancerProfile,
    DateTimeOffset CreatedAt);

public record SmallBusinessProfileResponse(
    string BusinessName,
    string RegistrationNumber,
    string? BusinessBankAccountName,
    string? BusinessBankAccountLast4,
    string VerificationStatus);

public record FreelancerProfileResponse(
    string FullName,
    string? PersonalBankAccountName,
    string? PersonalBankAccountLast4,
    string VerificationStatus);
