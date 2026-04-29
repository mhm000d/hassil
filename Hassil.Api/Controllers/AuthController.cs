using Hassil.Api.Contracts.Auth;
using Hassil.Api.Mappings;
using Hassil.Api.Services.Auth;
using Microsoft.AspNetCore.Mvc;

namespace Hassil.Api.Controllers;

[ApiController]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost(ApiEndpoints.Auth.DemoLogin)]
    public async Task<IActionResult> DemoLogin(
        [FromBody] DemoLoginRequest request,
        CancellationToken ct)
    {
        var authResult = await authService.DemoLoginAsync(request, ct);
        return Ok(authResult.ToResponse());
    }
}
