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

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
