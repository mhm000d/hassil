using System.Security.Claims;
using System.Text.Encodings.Web;
using Hassil.Api.Services.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Net.Http.Headers;
using Microsoft.Extensions.Options;

namespace Hassil.Api.Authentication;

public class DemoBearerAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IDemoTokenService tokenService)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(HeaderNames.Authorization, out var authorizationValues))
            return Task.FromResult(AuthenticateResult.NoResult());

        var authorization = authorizationValues.ToString();
        if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return Task.FromResult(AuthenticateResult.NoResult());

        var accessToken = authorization["Bearer ".Length..].Trim();
        var principal = tokenService.ValidateToken(accessToken);
        if (principal is null)
            return Task.FromResult(AuthenticateResult.Fail("Invalid or expired bearer token."));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, principal.UserId.ToString()),
            new Claim(ClaimTypes.Email, principal.Email),
            new Claim(ClaimTypes.Role, principal.Role),
            new Claim("account_type", principal.AccountType),
            new Claim("exp", principal.ExpiresAt.ToUnixTimeSeconds().ToString())
        };

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
