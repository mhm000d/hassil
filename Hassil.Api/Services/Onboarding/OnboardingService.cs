using Hassil.Api.Contracts.Onboarding;
using Hassil.Api.Database;
using Hassil.Api.Domain.Models;
using Hassil.Api.Exceptions;
using Hassil.Api.Services.Auth;
using Microsoft.EntityFrameworkCore;
using ValidationException = Hassil.Api.Exceptions.ValidationException;

namespace Hassil.Api.Services.Onboarding;

public class OnboardingService(
    HassilDbContext dbContext,
    IDemoTokenService tokenService,
    ILogger<OnboardingService> logger) : IOnboardingService
{
    public async Task<AuthResult> CreateSmallBusinessAsync(
        CreateSmallBusinessOnboardingRequest request,
        CancellationToken ct = default)
    {
        EnsureRequired(request.Email, "Email is required.", "EMAIL_REQUIRED");
        EnsureRequired(request.BusinessName, "Business name is required.", "BUSINESS_NAME_REQUIRED");
        EnsureRequired(request.RegistrationNumber, "Registration number is required.", "REGISTRATION_NUMBER_REQUIRED");

        var email = NormalizeEmail(request.Email);
        await EnsureEmailAvailableAsync(email, ct);
        await EnsureRegistrationNumberAvailableAsync(request.RegistrationNumber, ct);

        var user = User.CreateSmallBusiness(
            email:              email,
            businessName:       request.BusinessName,
            registrationNumber: request.RegistrationNumber.Trim(),
            phone:              request.Phone,
            country:            request.Country);

        user.SmallBusinessProfile!.UpdateBankAccount(
            request.BusinessBankAccountName,
            request.BusinessBankAccountLast4);

        var trustScoreEvent = user.AdjustTrustScore(5, "Profile completed.");

        dbContext.Users.Add(user);
        dbContext.TrustScoreEvents.Add(trustScoreEvent);

        await dbContext.SaveChangesAsync(ct);

        logger.LogInformation(
            "Small business onboarded. UserId={UserId} Email={Email}",
            user.Id,
            user.Email);

        return IssueAuthResult(user);
    }

    public async Task<AuthResult> CreateFreelancerAsync(
        CreateFreelancerOnboardingRequest request,
        CancellationToken ct = default)
    {
        EnsureRequired(request.Email, "Email is required.", "EMAIL_REQUIRED");
        EnsureRequired(request.FullName, "Full name is required.", "FULL_NAME_REQUIRED");

        var email = NormalizeEmail(request.Email);
        await EnsureEmailAvailableAsync(email, ct);

        var user = User.CreateFreelancer(
            email:   email,
            fullName: request.FullName,
            phone:   request.Phone,
            country: request.Country);

        user.FreelancerProfile!.UpdateBankAccount(
            request.PersonalBankAccountName,
            request.PersonalBankAccountLast4);

        var trustScoreEvent = user.AdjustTrustScore(5, "Profile completed.");

        dbContext.Users.Add(user);
        dbContext.TrustScoreEvents.Add(trustScoreEvent);

        await dbContext.SaveChangesAsync(ct);

        logger.LogInformation(
            "Freelancer onboarded. UserId={UserId} Email={Email}",
            user.Id,
            user.Email);

        return IssueAuthResult(user);
    }

    private async Task EnsureEmailAvailableAsync(string email, CancellationToken ct)
    {
        var exists = await dbContext.Users.AnyAsync(u => u.Email == email, ct);
        if (exists)
            throw new ConflictException("A user with this email already exists.", "EMAIL_ALREADY_EXISTS");
    }

    private async Task EnsureRegistrationNumberAvailableAsync(string registrationNumber, CancellationToken ct)
    {
        var trimmed = registrationNumber.Trim();
        var exists = await dbContext.SmallBusinessProfiles.AnyAsync(p => p.RegistrationNumber == trimmed, ct);
        if (exists)
            throw new ConflictException("A business with this registration number already exists.", "REGISTRATION_NUMBER_ALREADY_EXISTS");
    }

    private AuthResult IssueAuthResult(User user)
    {
        var token = tokenService.IssueToken(user);
        return new AuthResult(token.AccessToken, token.ExpiresAt, user);
    }

    private static string NormalizeEmail(string email) =>
        email.Trim().ToLowerInvariant();

    private static void EnsureRequired(string? value, string message, string code)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ValidationException(message, code);
    }
}
