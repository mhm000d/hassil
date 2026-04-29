using Hassil.Api.Contracts.Auth;
using Hassil.Api.Database;
using Hassil.Api.Domain.Enums;
using Hassil.Api.Domain.Models;
using Hassil.Api.Exceptions;
using Microsoft.EntityFrameworkCore;
using ValidationException = Hassil.Api.Exceptions.ValidationException;

namespace Hassil.Api.Services.Auth;

public class AuthService(
    HassilDbContext dbContext,
    IDemoTokenService tokenService) : IAuthService
{
    public async Task<AuthResult> DemoLoginAsync(
        DemoLoginRequest request,
        CancellationToken ct = default)
    {
        var email = ResolveDemoEmail(request.Persona)
                    ?? throw new ValidationException(
                        $"'{request.Persona}' is not a valid demo persona.",
                        "INVALID_DEMO_PERSONA");

        var user = await UsersWithProfiles()
                       .FirstOrDefaultAsync(u => u.Email == email, ct)
                   ?? throw new NotFoundException(
                       "Demo user not found. Seed demo data first with POST /api/demo/seed.",
                       "DEMO_USER_NOT_FOUND");

        if (user.Status != UserStatus.Active)
            throw new UnauthorizedException("Demo user is not active.", "DEMO_USER_NOT_ACTIVE");

        var token = tokenService.IssueToken(user);

        return new AuthResult(token.AccessToken, token.ExpiresAt, user);
    }

    public async Task<User> GetCurrentUserAsync(Guid userId, CancellationToken ct = default)
    {
        return await UsersWithProfiles()
                   .FirstOrDefaultAsync(u => u.Id == userId, ct)
               ?? throw new NotFoundException("User not found.", "USER_NOT_FOUND");
    }

    private IQueryable<User> UsersWithProfiles() =>
        dbContext.Users
            .Include(u => u.SmallBusinessProfile)
            .Include(u => u.FreelancerProfile);

    private static string? ResolveDemoEmail(string persona)
    {
        var normalized = persona.Trim().ToLowerInvariant()
            .Replace("-", "_")
            .Replace(" ", "_");

        return normalized switch
        {
            "small_business" or "business" or "ahmed" or "ahmed_studio"
                => DemoIdentityEmails.AhmedStudio,
            "freelancer" or "sara" or "sara_designs"
                => DemoIdentityEmails.SaraDesigns,
            "admin" or "reviewer" or "admin_reviewer"
                => DemoIdentityEmails.AdminReviewer,
            _ => null
        };
    }
}

public static class DemoIdentityEmails
{
    public const string AhmedStudio = "finance@ahmedstudio.co";
    public const string SaraDesigns = "sara@saradesigns.co";
    public const string AdminReviewer = "review@hassil.co";
}
