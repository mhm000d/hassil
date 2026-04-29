using System.Security.Claims;
using Hassil.Api.Mappings;
using Hassil.Api.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hassil.Api.Controllers;

[ApiController]
[Authorize]
public class UsersController(IAuthService authService) : ControllerBase
{
    [HttpGet(ApiEndpoints.Users.Me)]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var user = await authService.GetCurrentUserAsync(GetUserId(), ct);
        return Ok(user.ToResponse());
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
