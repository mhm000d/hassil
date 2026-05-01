using System.Security.Claims;
using Hassil.Api.Contracts.AdminReviews;
using Hassil.Api.Mappings;
using Hassil.Api.Services.AdminReviews;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hassil.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
public class AdminReviewsController(IAdminReviewService adminReviewService) : ControllerBase
{
    [HttpGet(ApiEndpoints.Admin.GetPendingAdvanceRequests)]
    public async Task<IActionResult> GetPending(CancellationToken ct)
    {
        var advanceRequests = await adminReviewService.GetPendingAsync(ct);
        return Ok(advanceRequests.Select(a => a.ToSummaryResponse()).ToList());
    }

    [HttpGet(ApiEndpoints.Admin.GetAdvanceRequest)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var detail = await adminReviewService.GetDetailAsync(id, ct);
        return Ok(detail.ToResponse());
    }

    [HttpPost(ApiEndpoints.Admin.ApproveAdvanceRequest)]
    public async Task<IActionResult> Approve(
        Guid id,
        [FromBody] ApproveAdvanceRequestRequest? request,
        CancellationToken ct)
    {
        var detail = await adminReviewService.ApproveAsync(
            GetUserId(),
            id,
            request?.Notes,
            ct);

        return Ok(detail.ToResponse());
    }

    [HttpPost(ApiEndpoints.Admin.RejectAdvanceRequest)]
    public async Task<IActionResult> Reject(
        Guid id,
        [FromBody] RejectAdvanceRequestRequest request,
        CancellationToken ct)
    {
        var detail = await adminReviewService.RejectAsync(
            GetUserId(),
            id,
            request.Reason,
            ct);

        return Ok(detail.ToResponse());
    }

    [HttpPost(ApiEndpoints.Admin.RequestMoreInfo)]
    public async Task<IActionResult> RequestMoreInfo(
        Guid id,
        [FromBody] RequestMoreInfoRequest? request,
        CancellationToken ct)
    {
        var detail = await adminReviewService.RequestMoreInfoAsync(
            GetUserId(),
            id,
            request?.Notes,
            ct);

        return Ok(detail.ToResponse());
    }

    [HttpPost(ApiEndpoints.Admin.GenerateAiReview)]
    public async Task<IActionResult> GenerateAiReview(Guid id, CancellationToken ct)
    {
        var detail = await adminReviewService.GenerateAiReviewAsync(id, ct);
        return Ok(detail.ToResponse());
    }

    [HttpPost(ApiEndpoints.Admin.SendClientConfirmation)]
    public async Task<IActionResult> SendClientConfirmation(Guid id, CancellationToken ct)
    {
        var detail = await adminReviewService.SendClientConfirmationAsync(id, ct);
        return Ok(detail.ToResponse());
    }

    [HttpPost(ApiEndpoints.Admin.ApproveAndDisburse)]
    public async Task<IActionResult> ApproveAndDisburse(
        Guid id,
        [FromBody] ApproveAdvanceRequestRequest? request,
        CancellationToken ct)
    {
        var detail = await adminReviewService.ApproveAndDisburseAsync(
            GetUserId(),
            id,
            request?.Notes,
            ct);

        return Ok(detail.ToResponse());
    }

    [HttpPost(ApiEndpoints.Admin.SimulateDisbursement)]
    public async Task<IActionResult> SimulateDisbursement(Guid id, CancellationToken ct)
    {
        var detail = await adminReviewService.SimulateDisbursementAsync(id, ct);
        return Ok(detail.ToResponse());
    }

    [HttpPost(ApiEndpoints.Admin.SimulateClientPaymentDetected)]
    public async Task<IActionResult> SimulateClientPaymentDetected(Guid id, CancellationToken ct)
    {
        var detail = await adminReviewService.SimulateClientPaymentDetectedAsync(id, ct);
        return Ok(detail.ToResponse());
    }

    [HttpPost(ApiEndpoints.Admin.SimulateUserRepayment)]
    public async Task<IActionResult> SimulateUserRepayment(Guid id, CancellationToken ct)
    {
        var detail = await adminReviewService.SimulateUserRepaymentAsync(id, ct);
        return Ok(detail.ToResponse());
    }

    [HttpPost(ApiEndpoints.Admin.SimulateClientPaymentToHassil)]
    public async Task<IActionResult> SimulateClientPaymentToHassil(Guid id, CancellationToken ct)
    {
        var detail = await adminReviewService.SimulateClientPaymentToHassilAsync(id, ct);
        return Ok(detail.ToResponse());
    }

    [HttpPost(ApiEndpoints.Admin.SimulateBufferRelease)]
    public async Task<IActionResult> SimulateBufferRelease(Guid id, CancellationToken ct)
    {
        var detail = await adminReviewService.SimulateBufferReleaseAsync(id, ct);
        return Ok(detail.ToResponse());
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
