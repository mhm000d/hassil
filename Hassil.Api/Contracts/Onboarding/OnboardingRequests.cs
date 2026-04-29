namespace Hassil.Api.Contracts.Onboarding;

public record CreateSmallBusinessOnboardingRequest(
    string Email,
    string BusinessName,
    string RegistrationNumber,
    string? Phone,
    string? Country,
    string? BusinessBankAccountName,
    string? BusinessBankAccountLast4);

public record CreateFreelancerOnboardingRequest(
    string Email,
    string FullName,
    string? Phone,
    string? Country,
    string? PersonalBankAccountName,
    string? PersonalBankAccountLast4);
