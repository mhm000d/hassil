using System.Security.Claims;
using Hassil.Api.Mappings;
using Hassil.Api.Services.TrustScores;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hassil.Api.Controllers;

[ApiController]
[Authorize]
public class TrustScoresController(ITrustScoreService trustScoreService) : ControllerBase
{
    [HttpGet(ApiEndpoints.TrustScores.Events)]
    public async Task<IActionResult> GetEvents(CancellationToken ct)
    {
        var history = await trustScoreService.GetHistoryAsync(GetUserId(), ct);
        return Ok(history.ToResponse());
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
