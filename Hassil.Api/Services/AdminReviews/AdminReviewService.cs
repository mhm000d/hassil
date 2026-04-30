using Hassil.Api.Database;
using Hassil.Api.Domain.Enums;
using Hassil.Api.Domain.Models;
using Hassil.Api.Exceptions;
using Hassil.Api.Services.AdvanceRequests;
using Microsoft.EntityFrameworkCore;
using ValidationException = Hassil.Api.Exceptions.ValidationException;

namespace Hassil.Api.Services.AdminReviews;

public class AdminReviewService(
    HassilDbContext dbContext,
    IAdvanceCalculatorService calculator,
    IAiReviewService aiReviewService,
    ILogger<AdminReviewService> logger) : IAdminReviewService
{
    public async Task<IReadOnlyList<AdvanceRequest>> GetPendingAsync(
        CancellationToken ct = default)
    {
        return await AdvanceQuery()
            .Where(a => a.Status == AdvanceStatus.PendingReview)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<AdminReviewDetail> GetDetailAsync(
        Guid advanceRequestId,
        CancellationToken ct = default)
    {
        var advance = await GetAdvanceForAdminAsync(advanceRequestId, ct);
        return BuildDetail(advance);
    }

    public async Task<AdminReviewDetail> ApproveAsync(
        Guid reviewerUserId,
        Guid advanceRequestId,
        string? notes,
        CancellationToken ct = default)
    {
        var reviewer = await GetReviewerAsync(reviewerUserId, ct);
        var advance = await GetAdvanceForAdminAsync(advanceRequestId, ct);
        EnsurePendingReview(advance);

        RunTransition(
            () =>
            {
                advance.ApproveManually(reviewer.Id);
                advance.Invoice.Approve();
            },
            "INVALID_ADMIN_REVIEW_TRANSITION");

        AddReview(advance, reviewer.Id, AdminDecision.Approved, notes);

        await dbContext.SaveChangesAsync(ct);

        logger.LogInformation(
            "Advance request approved by admin. AdvanceRequestId={AdvanceRequestId} ReviewerUserId={ReviewerUserId}",
            advance.Id,
            reviewer.Id);

        return await GetDetailAsync(advance.Id, ct);
    }

    public async Task<AdminReviewDetail> RejectAsync(
        Guid reviewerUserId,
        Guid advanceRequestId,
        string reason,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new ValidationException("Rejection reason is required.", "REJECTION_REASON_REQUIRED");

        var reviewer = await GetReviewerAsync(reviewerUserId, ct);
        var advance = await GetAdvanceForAdminAsync(advanceRequestId, ct);
        EnsurePendingReview(advance);

        RunTransition(
            () =>
            {
                advance.Reject(reason, reviewer.Id);
                advance.Invoice.Reject();
            },
            "INVALID_ADMIN_REVIEW_TRANSITION");

        AddReview(advance, reviewer.Id, AdminDecision.Rejected, reason);
        AddTrustScoreEvent(advance.User, -15, "Admin rejected advance request.");

        await dbContext.SaveChangesAsync(ct);

        logger.LogInformation(
            "Advance request rejected by admin. AdvanceRequestId={AdvanceRequestId} ReviewerUserId={ReviewerUserId}",
            advance.Id,
            reviewer.Id);

        return await GetDetailAsync(advance.Id, ct);
    }

    public async Task<AdminReviewDetail> RequestMoreInfoAsync(
        Guid reviewerUserId,
        Guid advanceRequestId,
        string? notes,
        CancellationToken ct = default)
    {
        var reviewer = await GetReviewerAsync(reviewerUserId, ct);
        var advance = await GetAdvanceForAdminAsync(advanceRequestId, ct);

        EnsurePendingReview(advance);

        AddReview(
            advance,
            reviewer.Id,
            AdminDecision.RequestMoreInfo,
            notes ?? "Additional evidence requested.");

        await dbContext.SaveChangesAsync(ct);

        logger.LogInformation(
            "Admin requested more information. AdvanceRequestId={AdvanceRequestId} ReviewerUserId={ReviewerUserId}",
            advance.Id,
            reviewer.Id);

        return await GetDetailAsync(advance.Id, ct);
    }

    public async Task<AdminReviewDetail> GenerateAiReviewAsync(
        Guid advanceRequestId,
        CancellationToken ct = default)
    {
        var advance = await GetAdvanceForAdminAsync(advanceRequestId, ct);
        var snapshot = aiReviewService.GenerateSnapshot(advance);

        advance.AddAiReviewSnapshot(snapshot);
        dbContext.AiReviewSnapshots.Add(snapshot);

        await dbContext.SaveChangesAsync(ct);

        return await GetDetailAsync(advance.Id, ct);
    }

    private IQueryable<AdvanceRequest> AdvanceQuery() =>
        dbContext.AdvanceRequests
            .Include(a => a.User)
            .Include(a => a.Invoice)
            .ThenInclude(i => i.Client)
            .Include(a => a.Invoice)
            .ThenInclude(i => i.Documents)
            .Include(a => a.Invoice)
            .ThenInclude(i => i.ClientConfirmation)
            .Include(a => a.Transactions)
            .Include(a => a.AiReviewSnapshots)
            .Include(a => a.AdminReviews);

    private async Task<AdvanceRequest> GetAdvanceForAdminAsync(
        Guid advanceRequestId,
        CancellationToken ct)
    {
        return await AdvanceQuery()
                   .FirstOrDefaultAsync(a => a.Id == advanceRequestId, ct)
               ?? throw new NotFoundException("Advance request not found.", "ADVANCE_REQUEST_NOT_FOUND");
    }

    private async Task<User> GetReviewerAsync(Guid reviewerUserId, CancellationToken ct)
    {
        var reviewer = await dbContext.Users
                           .FirstOrDefaultAsync(u => u.Id == reviewerUserId, ct)
                       ?? throw new NotFoundException("Reviewer user not found.", "REVIEWER_NOT_FOUND");

        if (reviewer.Role != UserRole.Admin)
            throw new ForbiddenException("Admin reviewer role is required.", "ADMIN_ROLE_REQUIRED");

        return reviewer;
    }

    private AdminReviewDetail BuildDetail(AdvanceRequest advance)
    {
        var latestAiReview = advance.AiReviewSnapshots
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefault();

        return new AdminReviewDetail(
            AdvanceRequest:          advance,
            VerificationChecklist:   BuildChecklist(advance),
            LatestAiReview:          latestAiReview);
    }

    private IReadOnlyList<ReviewChecklistItem> BuildChecklist(AdvanceRequest advance)
    {
        var invoice = advance.Invoice;
        var quote = calculator.Calculate(advance.User, invoice, requestedPercent: null);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var daysUntilDue = invoice.DueDate.DayNumber - today.DayNumber;
        var confirmationPassed = advance.FinancingModel != FinancingModel.InvoiceFactoring
                                 || invoice.ClientConfirmation?.Status == ConfirmationStatus.Confirmed;

        return
        [
            new(
                "User account is active",
                advance.User.Status == UserStatus.Active,
                $"Current status: {advance.User.Status}."),
            new(
                "Terms accepted",
                advance.TermsAcceptedAt is not null,
                advance.TermsAcceptedAt is null
                    ? "The user has not accepted advance terms."
                    : $"Accepted version {advance.TermsVersion}."),
            new(
                "Supporting evidence attached",
                invoice.Documents.Count > 0,
                $"{invoice.Documents.Count} document(s) attached."),
            new(
                "Due date is within the 90-day window",
                daysUntilDue is >= 0 and <= 90,
                $"{daysUntilDue} day(s) until due date."),
            new(
                "Invoice amount is within current limit",
                invoice.Amount <= quote.MaxEligibleInvoiceAmount,
                $"Invoice amount {invoice.Amount:0.00} {invoice.Currency}; limit {quote.MaxEligibleInvoiceAmount:0.00} {invoice.Currency}."),
            new(
                "Trust score supports approval",
                advance.User.TrustScore >= 50,
                $"Current trust score: {advance.User.TrustScore}."),
            new(
                "Client confirmation requirement satisfied",
                confirmationPassed,
                advance.FinancingModel == FinancingModel.InvoiceFactoring
                    ? $"Confirmation status: {invoice.ClientConfirmation?.Status.ToString() ?? "Missing"}."
                    : "Not required for invoice discounting.")
        ];
    }

    private void AddReview(
        AdvanceRequest advance,
        Guid reviewerUserId,
        AdminDecision decision,
        string? notes)
    {
        var review = AdminReview.Create(
            advanceRequestId: advance.Id,
            reviewerUserId:   reviewerUserId,
            decision:         decision,
            notes:            notes);

        advance.AddAdminReview(review);
        dbContext.AdminReviews.Add(review);
    }

    private void AddTrustScoreEvent(User user, int delta, string reason)
    {
        var trustScoreEvent = user.AdjustTrustScore(delta, reason);
        dbContext.TrustScoreEvents.Add(trustScoreEvent);
    }

    private static void EnsurePendingReview(AdvanceRequest advance)
    {
        if (advance.Status != AdvanceStatus.PendingReview)
            throw new ConflictException(
                $"Advance request '{advance.Id}' must be pending review before manual admin action.",
                "INVALID_ADMIN_REVIEW_TRANSITION");
    }

    private static void RunTransition(Action transition, string code)
    {
        try
        {
            transition();
        }
        catch (InvalidOperationException ex)
        {
            throw new ConflictException(ex.Message, code);
        }
    }
}
