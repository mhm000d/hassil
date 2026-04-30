using System.Security.Claims;
using Hassil.Api.Services.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hassil.Api.Controllers;

[ApiController]
[Authorize]
public class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    [HttpGet(ApiEndpoints.Dashboard.Summary)]
    public async Task<IActionResult> GetSummary(CancellationToken ct)
    {
        var summary = await dashboardService.GetSummaryAsync(GetUserId(), ct);
        return Ok(summary);
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
