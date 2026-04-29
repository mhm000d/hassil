using Hassil.Api.Contracts.ClientConfirmations;
using Hassil.Api.Mappings;
using Hassil.Api.Services.ClientConfirmations;
using Microsoft.AspNetCore.Mvc;

namespace Hassil.Api.Controllers;

[ApiController]
public class ClientConfirmationsController(
    IClientConfirmationService clientConfirmationService) : ControllerBase
{
    [HttpGet(ApiEndpoints.ClientConfirmations.Get)]
    public async Task<IActionResult> Get(string token, CancellationToken ct)
    {
        var confirmation = await clientConfirmationService.GetAsync(token, ct);
        return Ok(confirmation.ToResponse());
    }

    [HttpPost(ApiEndpoints.ClientConfirmations.Confirm)]
    public async Task<IActionResult> Confirm(
        string token,
        [FromBody] ClientConfirmationDecisionRequest request,
        CancellationToken ct)
    {
        var confirmation = await clientConfirmationService.ConfirmAsync(token, request.Note, ct);
        return Ok(confirmation.ToResponse());
    }

    [HttpPost(ApiEndpoints.ClientConfirmations.Dispute)]
    public async Task<IActionResult> Dispute(
        string token,
        [FromBody] ClientConfirmationDecisionRequest request,
        CancellationToken ct)
    {
        var confirmation = await clientConfirmationService.DisputeAsync(token, request.Note, ct);
        return Ok(confirmation.ToResponse());
    }
}
