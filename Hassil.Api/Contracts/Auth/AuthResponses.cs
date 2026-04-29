using Hassil.Api.Contracts.Users;

namespace Hassil.Api.Contracts.Auth;

public record AuthResponse(
    string AccessToken,
    DateTimeOffset ExpiresAt,
    UserResponse User);
