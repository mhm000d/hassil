using Hassil.Api.Database;
using Hassil.Api.Domain.Enums;
using Hassil.Api.Domain.Models;
using Hassil.Api.Exceptions;
using Hassil.Api.Services.AdvanceRequests;
using Hassil.Api.Services.Ledger;
using Hassil.Api.Services.Notifications;
using Hassil.Api.Services.OpenBanking;
using Microsoft.EntityFrameworkCore;
using ValidationException = Hassil.Api.Exceptions.ValidationException;

namespace Hassil.Api.Services.AdminReviews;

public class AdminReviewService(
    HassilDbContext dbContext,
    IAdvanceCalculatorService calculator,
    IAiReviewService aiReviewService,
    ILedgerService ledgerService,
    IMockNotificationService notificationService,
    IOpenBankingGateway openBankingGateway,
    ILogger<AdminReviewService> logger) : IAdminReviewService
{
    private static readonly AdvanceStatus[] AdminWorkStatuses =
    [
        AdvanceStatus.PendingClientConfirmation,
        AdvanceStatus.PendingReview,
        AdvanceStatus.Approved,
        AdvanceStatus.Disbursed,
        AdvanceStatus.ClientPaymentDetected,
        AdvanceStatus.ClientPaidHassil
    ];

    public async Task<IReadOnlyList<AdvanceRequest>> GetPendingAsync(
        CancellationToken ct = default)
    {
        return await AdvanceQuery()
            .Where(a => AdminWorkStatuses.Contains(a.Status))
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

    public async Task<AdminReviewDetail> SendClientConfirmationAsync(
        Guid advanceRequestId,
        CancellationToken ct = default)
    {
        var advance = await GetAdvanceForAdminAsync(advanceRequestId, ct);
        EnsureFinancingModel(advance, FinancingModel.InvoiceFactoring);

        if (advance.Invoice.ClientConfirmation is null)
        {
            var confirmation = notificationService.CreateClientConfirmation(advance.Invoice);
            advance.Invoice.AttachClientConfirmation(confirmation);
            dbContext.ClientConfirmations.Add(confirmation);
        }

        await dbContext.SaveChangesAsync(ct);

        logger.LogInformation(
            "Client confirmation link issued by admin. AdvanceRequestId={AdvanceRequestId} InvoiceId={InvoiceId}",
            advance.Id,
            advance.InvoiceId);

        return await GetDetailAsync(advance.Id, ct);
    }

    public async Task<AdminReviewDetail> ApproveAndDisburseAsync(
        Guid reviewerUserId,
        Guid advanceRequestId,
        string? notes,
        CancellationToken ct = default)
    {
        var reviewer = await GetReviewerAsync(reviewerUserId, ct);
        var advance = await GetAdvanceForAdminAsync(advanceRequestId, ct);

        if (advance.Status == AdvanceStatus.PendingClientConfirmation)
            throw new ConflictException(
                "Client confirmation must be completed before admin approval and disbursement.",
                "CLIENT_CONFIRMATION_REQUIRED");

        if (advance.Status == AdvanceStatus.PendingReview)
        {
            RunTransition(
                () =>
                {
                    advance.ApproveManually(reviewer.Id);
                    advance.Invoice.Approve();
                },
                "INVALID_ADMIN_REVIEW_TRANSITION");

            AddReview(
                advance,
                reviewer.Id,
                AdminDecision.Approved,
                notes ?? "Manual review completed. Approved and disbursed by admin.");
        }
        else if (advance.Status != AdvanceStatus.Approved)
        {
            throw new ConflictException(
                $"Advance request '{advance.Id}' cannot be approved and disbursed from status '{advance.Status}'.",
                "INVALID_ADMIN_LIFECYCLE_TRANSITION");
        }
        else
        {
            AddReview(
                advance,
                reviewer.Id,
                AdminDecision.Approved,
                notes ?? "Approved request disbursed by admin.");
        }

        await DisburseAsync(advance, ct);
        await dbContext.SaveChangesAsync(ct);

        logger.LogInformation(
            "Advance request approved and disbursed by admin. AdvanceRequestId={AdvanceRequestId} ReviewerUserId={ReviewerUserId}",
            advance.Id,
            reviewer.Id);

        return await GetDetailAsync(advance.Id, ct);
    }

    public async Task<AdminReviewDetail> SimulateDisbursementAsync(
        Guid advanceRequestId,
        CancellationToken ct = default)
    {
        var advance = await GetAdvanceForAdminAsync(advanceRequestId, ct);
        await DisburseAsync(advance, ct);
        await dbContext.SaveChangesAsync(ct);
        return await GetDetailAsync(advance.Id, ct);
    }

    public async Task<AdminReviewDetail> SimulateClientPaymentDetectedAsync(
        Guid advanceRequestId,
        CancellationToken ct = default)
    {
        var advance = await GetAdvanceForAdminAsync(advanceRequestId, ct);
        EnsureFinancingModel(advance, FinancingModel.InvoiceDiscounting);

        await openBankingGateway.DetectIncomingClientPaymentToUserAsync(
            userId:         advance.UserId,
            invoiceId:      advance.InvoiceId,
            expectedAmount: advance.Invoice.Amount,
            currency:       advance.Invoice.Currency,
            ct:             ct);

        RunTransition(advance.MarkClientPaymentDetected, "INVALID_ADMIN_LIFECYCLE_TRANSITION");

        ledgerService.Record(
            userId:           advance.UserId,
            type:             TransactionType.DetectedIncomingPayment,
            direction:        TransactionDirection.Internal,
            amount:           advance.Invoice.Amount,
            invoiceId:        advance.InvoiceId,
            advanceRequestId: advance.Id,
            description:      $"Client payment detected for invoice {advance.Invoice.InvoiceNumber}.");

        await dbContext.SaveChangesAsync(ct);
        return await GetDetailAsync(advance.Id, ct);
    }

    public async Task<AdminReviewDetail> SimulateUserRepaymentAsync(
        Guid advanceRequestId,
        CancellationToken ct = default)
    {
        var advance = await GetAdvanceForAdminAsync(advanceRequestId, ct);
        EnsureFinancingModel(advance, FinancingModel.InvoiceDiscounting);

        await openBankingGateway.PullRepaymentFromUserAsync(
            userId:      advance.UserId,
            amount:      advance.ExpectedRepaymentAmount,
            currency:    advance.Invoice.Currency,
            description: $"Repayment for invoice {advance.Invoice.InvoiceNumber}.",
            ct:          ct);

        RunTransition(
            () =>
            {
                advance.MarkRepaid();
                advance.Invoice.MarkPaid();
            },
            "INVALID_ADMIN_LIFECYCLE_TRANSITION");

        ledgerService.Record(
            userId:           advance.UserId,
            type:             TransactionType.UserRepayment,
            direction:        TransactionDirection.Debit,
            amount:           advance.ExpectedRepaymentAmount,
            invoiceId:        advance.InvoiceId,
            advanceRequestId: advance.Id,
            description:      $"User repaid Hassil for invoice {advance.Invoice.InvoiceNumber}.");

        ledgerService.Record(
            userId:           advance.UserId,
            type:             TransactionType.PlatformFee,
            direction:        TransactionDirection.Internal,
            amount:           advance.FeeAmount,
            invoiceId:        advance.InvoiceId,
            advanceRequestId: advance.Id,
            description:      "Platform fee collected at repayment.");

        AddTrustScoreEvent(advance.User, 10, "Advance repaid on time.");

        await dbContext.SaveChangesAsync(ct);
        return await GetDetailAsync(advance.Id, ct);
    }

    public async Task<AdminReviewDetail> SimulateClientPaymentToHassilAsync(
        Guid advanceRequestId,
        CancellationToken ct = default)
    {
        var advance = await GetAdvanceForAdminAsync(advanceRequestId, ct);
        EnsureFinancingModel(advance, FinancingModel.InvoiceFactoring);

        await openBankingGateway.ReceiveClientPaymentToHassilAsync(
            clientId:  advance.Invoice.ClientId,
            invoiceId: advance.InvoiceId,
            amount:    advance.Invoice.Amount,
            currency:  advance.Invoice.Currency,
            ct:        ct);

        RunTransition(advance.MarkClientPaidHassil, "INVALID_ADMIN_LIFECYCLE_TRANSITION");

        ledgerService.Record(
            userId:           advance.UserId,
            type:             TransactionType.ClientPaymentToHassil,
            direction:        TransactionDirection.Credit,
            amount:           advance.Invoice.Amount,
            invoiceId:        advance.InvoiceId,
            advanceRequestId: advance.Id,
            description:      $"Client paid Hassil for invoice {advance.Invoice.InvoiceNumber}.");

        await dbContext.SaveChangesAsync(ct);
        return await GetDetailAsync(advance.Id, ct);
    }

    public async Task<AdminReviewDetail> SimulateBufferReleaseAsync(
        Guid advanceRequestId,
        CancellationToken ct = default)
    {
        var advance = await GetAdvanceForAdminAsync(advanceRequestId, ct);
        EnsureFinancingModel(advance, FinancingModel.InvoiceFactoring);

        await openBankingGateway.ReleaseBufferToUserAsync(
            userId:      advance.UserId,
            amount:      advance.SettlementBufferAmount,
            currency:    advance.Invoice.Currency,
            description: $"Settlement buffer release for invoice {advance.Invoice.InvoiceNumber}.",
            ct:          ct);

        RunTransition(
            () =>
            {
                advance.ReleaseBuffer();
                advance.MarkRepaid();
                advance.Invoice.MarkPaid();
            },
            "INVALID_ADMIN_LIFECYCLE_TRANSITION");

        ledgerService.Record(
            userId:           advance.UserId,
            type:             TransactionType.PlatformFee,
            direction:        TransactionDirection.Internal,
            amount:           advance.FeeAmount,
            invoiceId:        advance.InvoiceId,
            advanceRequestId: advance.Id,
            description:      "Platform fee collected from settlement.");

        ledgerService.Record(
            userId:           advance.UserId,
            type:             TransactionType.BufferRelease,
            direction:        TransactionDirection.Credit,
            amount:           advance.SettlementBufferAmount,
            invoiceId:        advance.InvoiceId,
            advanceRequestId: advance.Id,
            description:      $"Remaining settlement buffer released for invoice {advance.Invoice.InvoiceNumber}.");

        AddTrustScoreEvent(advance.User, 10, "Factoring advance completed with buffer release.");

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
        var quote = calculator.Calculate(advance.User, invoice, advance.RequestedPercent);
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
                "Supporting evidence is optional",
                true,
                $"{invoice.Documents.Count} optional document(s) attached."),
            new(
                "Due date is within the 90-day window",
                daysUntilDue is >= 0 and <= 90,
                $"{daysUntilDue} day(s) until due date."),
            new(
                "Requested advance is within current funding limit",
                advance.AdvanceAmount <= quote.MaxEligibleInvoiceAmount,
                $"Requested advance {advance.AdvanceAmount:0.00} {invoice.Currency}; limit {quote.MaxEligibleInvoiceAmount:0.00} {invoice.Currency}."),
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

    private async Task DisburseAsync(AdvanceRequest advance, CancellationToken ct)
    {
        await openBankingGateway.PushAdvanceToUserAsync(
            userId:      advance.UserId,
            amount:      advance.AdvanceAmount,
            currency:    advance.Invoice.Currency,
            description: $"Advance disbursement for invoice {advance.Invoice.InvoiceNumber}.",
            ct:          ct);

        RunTransition(
            () =>
            {
                advance.Disburse();
                advance.Invoice.MarkDisbursed();
            },
            "INVALID_ADMIN_LIFECYCLE_TRANSITION");

        ledgerService.Record(
            userId:           advance.UserId,
            type:             TransactionType.AdvanceDisbursement,
            direction:        TransactionDirection.Credit,
            amount:           advance.AdvanceAmount,
            invoiceId:        advance.InvoiceId,
            advanceRequestId: advance.Id,
            description:      $"Advance sent for invoice {advance.Invoice.InvoiceNumber}.");
    }

    private static void EnsureFinancingModel(
        AdvanceRequest advance,
        FinancingModel expected)
    {
        if (advance.FinancingModel != expected)
            throw new ConflictException(
                $"Advance request '{advance.Id}' uses '{advance.FinancingModel}' and cannot run this admin action.",
                "INVALID_FINANCING_MODEL");
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
