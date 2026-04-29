using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.Auth;

public interface IDemoTokenService
{
    DemoToken IssueToken(User user);

    DemoTokenPrincipal? ValidateToken(string accessToken);
}

public record DemoToken(string AccessToken, DateTimeOffset ExpiresAt);

public record DemoTokenPrincipal(
    Guid UserId,
    string Email,
    string Role,
    string AccountType,
    DateTimeOffset ExpiresAt);
