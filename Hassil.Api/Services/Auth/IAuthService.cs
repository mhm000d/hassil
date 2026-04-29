using Hassil.Api.Contracts.Auth;
using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.Auth;

public interface IAuthService
{
    Task<AuthResult> DemoLoginAsync(DemoLoginRequest request, CancellationToken ct = default);

    Task<User> GetCurrentUserAsync(Guid userId, CancellationToken ct = default);
}

public record AuthResult(
    string AccessToken,
    DateTimeOffset ExpiresAt,
    User User);
