using Hassil.Api.Contracts.Onboarding;
using Hassil.Api.Database;
using Hassil.Api.Domain.Models;
using Hassil.Api.Exceptions;
using Hassil.Api.Services.Auth;
using Microsoft.EntityFrameworkCore;

namespace Hassil.Api.Services.Onboarding;

public class OnboardingService(
    HassilDbContext dbContext,
    IDemoTokenService tokenService) : IOnboardingService
{
    public async Task<AuthResult> OnboardSmallBusinessAsync(
        OnboardSmallBusinessRequest request, 
        CancellationToken ct = default)
    {
        var emailNormalized = request.Email.Trim().ToLowerInvariant();

        if (await dbContext.Users.AnyAsync(u => u.Email.ToLower() == emailNormalized, ct))
        {
            throw new ValidationException("Email is already in use.", "EMAIL_IN_USE");
        }

        var user = User.CreateSmallBusiness(
            email: emailNormalized,
            businessName: request.BusinessName,
            registrationNumber: request.RegistrationNumber,
            phone: request.Phone,
            country: request.Country,
            passwordHash: request.Password // Storing raw password since we're in a demo context without hashing
        );

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(ct);

        var token = tokenService.IssueToken(user);
        return new AuthResult(token.AccessToken, token.ExpiresAt, user);
    }

    public async Task<AuthResult> OnboardFreelancerAsync(
        OnboardFreelancerRequest request, 
        CancellationToken ct = default)
    {
        var emailNormalized = request.Email.Trim().ToLowerInvariant();

        if (await dbContext.Users.AnyAsync(u => u.Email.ToLower() == emailNormalized, ct))
        {
            throw new ValidationException("Email is already in use.", "EMAIL_IN_USE");
        }

        var user = User.CreateFreelancer(
            email: emailNormalized,
            fullName: request.FullName,
            phone: request.Phone,
            country: request.Country,
            passwordHash: request.Password // Demo context
        );

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(ct);

        var token = tokenService.IssueToken(user);
        return new AuthResult(token.AccessToken, token.ExpiresAt, user);
    }
}
