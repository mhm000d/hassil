using Hassil.Api.Contracts.Auth;
using Hassil.Api.Services.Auth;

namespace Hassil.Api.Mappings;

public static class AuthMappings
{
    public static AuthResponse ToResponse(this AuthResult result) => new(
        AccessToken: result.AccessToken,
        ExpiresAt:   result.ExpiresAt,
        User:        result.User.ToResponse());
}
