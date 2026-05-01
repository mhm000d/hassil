using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.AdminReviews;

public interface IAdminReviewService
{
    Task<IReadOnlyList<AdvanceRequest>> GetPendingAsync(
        CancellationToken ct = default);

    Task<AdminReviewDetail> GetDetailAsync(
        Guid advanceRequestId,
        CancellationToken ct = default);

    Task<AdminReviewDetail> ApproveAsync(
        Guid reviewerUserId,
        Guid advanceRequestId,
        string? notes,
        CancellationToken ct = default);

    Task<AdminReviewDetail> RejectAsync(
        Guid reviewerUserId,
        Guid advanceRequestId,
        string reason,
        CancellationToken ct = default);

    Task<AdminReviewDetail> RequestMoreInfoAsync(
        Guid reviewerUserId,
        Guid advanceRequestId,
        string? notes,
        CancellationToken ct = default);

    Task<AdminReviewDetail> GenerateAiReviewAsync(
        Guid advanceRequestId,
        CancellationToken ct = default);

    Task<AdminReviewDetail> SendClientConfirmationAsync(
        Guid advanceRequestId,
        CancellationToken ct = default);

    Task<AdminReviewDetail> ApproveAndDisburseAsync(
        Guid reviewerUserId,
        Guid advanceRequestId,
        string? notes,
        CancellationToken ct = default);

    Task<AdminReviewDetail> SimulateDisbursementAsync(
        Guid advanceRequestId,
        CancellationToken ct = default);

    Task<AdminReviewDetail> SimulateClientPaymentDetectedAsync(
        Guid advanceRequestId,
        CancellationToken ct = default);

    Task<AdminReviewDetail> SimulateUserRepaymentAsync(
        Guid advanceRequestId,
        CancellationToken ct = default);

    Task<AdminReviewDetail> SimulateClientPaymentToHassilAsync(
        Guid advanceRequestId,
        CancellationToken ct = default);

    Task<AdminReviewDetail> SimulateBufferReleaseAsync(
        Guid advanceRequestId,
        CancellationToken ct = default);
}
