using System.Security.Claims;
using Hassil.Api.Contracts.AdvanceRequests;
using Hassil.Api.Mappings;
using Hassil.Api.Services.AdvanceRequests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hassil.Api.Controllers;

[ApiController]
[Authorize]
public class AdvanceRequestsController(IAdvanceRequestService advanceRequestService) : ControllerBase
{
    [HttpPost(ApiEndpoints.AdvanceRequests.Quote)]
    public async Task<IActionResult> Quote(
        [FromBody] AdvanceQuoteRequest request,
        CancellationToken ct)
    {
        var quote = await advanceRequestService.QuoteAsync(GetUserId(), request, ct);
        return Ok(quote.ToResponse());
    }

    [HttpPost(ApiEndpoints.AdvanceRequests.Create)]
    public async Task<IActionResult> Create(
        [FromBody] CreateAdvanceRequest request,
        CancellationToken ct)
    {
        var advanceRequest = await advanceRequestService.CreateAsync(GetUserId(), request, ct);
        return CreatedAtAction(nameof(Get), new { id = advanceRequest.Id }, advanceRequest.ToResponse());
    }

    [HttpGet(ApiEndpoints.AdvanceRequests.GetAll)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var advanceRequests = await advanceRequestService.GetAdvanceRequestsAsync(GetUserId(), ct);
        return Ok(advanceRequests.Select(a => a.ToSummaryResponse()).ToList());
    }

    [HttpGet(ApiEndpoints.AdvanceRequests.Get)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var advanceRequest = await advanceRequestService.GetAdvanceRequestAsync(GetUserId(), id, ct);
        return Ok(advanceRequest.ToResponse());
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
