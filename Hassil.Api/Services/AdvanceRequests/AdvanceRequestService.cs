using Hassil.Api.Contracts.AdvanceRequests;
using Hassil.Api.Database;
using Hassil.Api.Domain.Enums;
using Hassil.Api.Domain.Models;
using Hassil.Api.Exceptions;
using Hassil.Api.Services.Ledger;
using Hassil.Api.Services.Notifications;
using Hassil.Api.Services.OpenBanking;
using Microsoft.EntityFrameworkCore;
using ValidationException = Hassil.Api.Exceptions.ValidationException;

namespace Hassil.Api.Services.AdvanceRequests;

public class AdvanceRequestService(
    HassilDbContext dbContext,
    IAdvanceCalculatorService calculator,
    IReviewScoringService reviewScoringService,
    ILedgerService ledgerService,
    IMockNotificationService notificationService,
    IOpenBankingGateway openBankingGateway,
    ILogger<AdvanceRequestService> logger) : IAdvanceRequestService
{
    public async Task<AdvanceQuote> QuoteAsync(
        Guid userId,
        AdvanceQuoteRequest request,
        CancellationToken ct = default)
    {
        var (user, invoice) = await GetUserAndInvoiceAsync(userId, request.InvoiceId, ct);
        EnsureInvoiceCanBeQuoted(invoice);

        return calculator.Calculate(user, invoice, request.RequestedPercent);
    }

    public async Task<AdvanceRequest> CreateAsync(
        Guid userId,
        CreateAdvanceRequest request,
        CancellationToken ct = default)
    {
        if (!request.TermsAccepted)
            throw new ValidationException(
                "Terms must be accepted before creating an advance request.",
                "TERMS_NOT_ACCEPTED");

        var (user, invoice) = await GetUserAndInvoiceAsync(userId, request.InvoiceId, ct);

        if (invoice.Status != InvoiceStatus.Submitted)
            throw new ConflictException(
                $"Invoice '{invoice.InvoiceNumber}' must be submitted before requesting an advance.",
                "INVOICE_NOT_SUBMITTED");

        if (invoice.AdvanceRequest is not null)
            throw new ConflictException(
                "This invoice already has an advance request.",
                "ADVANCE_ALREADY_EXISTS");

        var quote = calculator.Calculate(user, invoice, request.RequestedPercent);
        if (!quote.IsEligible)
            throw new ValidationException(
                "Invoice is not eligible for an advance.",
                "ADVANCE_NOT_ELIGIBLE",
                quote.EligibilityMessages);

        var review = reviewScoringService.Score(user, invoice, quote, termsAccepted: true);

        var advanceRequest = AdvanceRequest.Create(
            invoiceId:                invoice.Id,
            userId:                   user.Id,
            financingModel:           quote.FinancingModel,
            requestedPercent:         quote.RequestedPercent,
            advanceAmount:            quote.AdvanceAmount,
            feeRate:                  quote.FeeRate,
            feeAmount:                quote.FeeAmount,
            settlementBufferAmount:   quote.SettlementBufferAmount,
            expectedRepaymentAmount:  quote.ExpectedRepaymentAmount,
            reviewScore:              review.Score,
            termsVersion:             request.TermsVersion ?? "hackathon-v1");

        advanceRequest.AcceptTerms(request.TermsVersion ?? "hackathon-v1");

        dbContext.AdvanceRequests.Add(advanceRequest);
        invoice.AttachAdvanceRequest(advanceRequest);
        invoice.MarkAdvanceRequested();

        if (quote.FinancingModel == FinancingModel.InvoiceFactoring
            && invoice.ClientConfirmation is null)
        {
            var confirmation = notificationService.CreateClientConfirmation(invoice);
            invoice.AttachClientConfirmation(confirmation);
        }

        ApplyInitialDecision(user, invoice, advanceRequest, quote, review);

        await dbContext.SaveChangesAsync(ct);

        logger.LogInformation(
            "Advance request created. AdvanceRequestId={AdvanceRequestId} InvoiceId={InvoiceId} Status={Status}",
            advanceRequest.Id,
            invoice.Id,
            advanceRequest.Status);

        return await GetAdvanceRequestAsync(userId, advanceRequest.Id, ct);
    }

    public async Task<IReadOnlyList<AdvanceRequest>> GetAdvanceRequestsAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        return await AdvanceQuery(userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<AdvanceRequest> GetAdvanceRequestAsync(
        Guid userId,
        Guid advanceRequestId,
        CancellationToken ct = default)
    {
        return await AdvanceQuery(userId)
                   .FirstOrDefaultAsync(a => a.Id == advanceRequestId, ct)
               ?? throw new NotFoundException("Advance request not found.", "ADVANCE_REQUEST_NOT_FOUND");
    }

    public async Task<AdvanceRequest> SimulateDisbursementAsync(
        Guid userId,
        Guid advanceRequestId,
        CancellationToken ct = default)
    {
        var advance = await GetAdvanceRequestAsync(userId, advanceRequestId, ct);

        await openBankingGateway.PushAdvanceToUserAsync(
            userId:      userId,
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
            "INVALID_ADVANCE_TRANSITION");

        ledgerService.Record(
            userId:           userId,
            type:             TransactionType.AdvanceDisbursement,
            direction:        TransactionDirection.Credit,
            amount:           advance.AdvanceAmount,
            invoiceId:        advance.InvoiceId,
            advanceRequestId: advance.Id,
            description:      $"Advance sent for invoice {advance.Invoice.InvoiceNumber}.");

        await dbContext.SaveChangesAsync(ct);
        return await GetAdvanceRequestAsync(userId, advance.Id, ct);
    }

    public async Task<AdvanceRequest> SimulateClientPaymentDetectedAsync(
        Guid userId,
        Guid advanceRequestId,
        CancellationToken ct = default)
    {
        var advance = await GetAdvanceRequestAsync(userId, advanceRequestId, ct);
        EnsureFinancingModel(advance, FinancingModel.InvoiceDiscounting);

        await openBankingGateway.DetectIncomingClientPaymentToUserAsync(
            userId:         userId,
            invoiceId:      advance.InvoiceId,
            expectedAmount: advance.Invoice.Amount,
            currency:       advance.Invoice.Currency,
            ct:             ct);

        RunTransition(advance.MarkClientPaymentDetected, "INVALID_ADVANCE_TRANSITION");

        ledgerService.Record(
            userId:           userId,
            type:             TransactionType.DetectedIncomingPayment,
            direction:        TransactionDirection.Internal,
            amount:           advance.Invoice.Amount,
            invoiceId:        advance.InvoiceId,
            advanceRequestId: advance.Id,
            description:      $"Client payment detected for invoice {advance.Invoice.InvoiceNumber}.");

        await dbContext.SaveChangesAsync(ct);
        return await GetAdvanceRequestAsync(userId, advance.Id, ct);
    }

    public async Task<AdvanceRequest> SimulateUserRepaymentAsync(
        Guid userId,
        Guid advanceRequestId,
        CancellationToken ct = default)
    {
        var advance = await GetAdvanceRequestAsync(userId, advanceRequestId, ct);
        EnsureFinancingModel(advance, FinancingModel.InvoiceDiscounting);

        await openBankingGateway.PullRepaymentFromUserAsync(
            userId:      userId,
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
            "INVALID_ADVANCE_TRANSITION");

        ledgerService.Record(
            userId:           userId,
            type:             TransactionType.UserRepayment,
            direction:        TransactionDirection.Debit,
            amount:           advance.ExpectedRepaymentAmount,
            invoiceId:        advance.InvoiceId,
            advanceRequestId: advance.Id,
            description:      $"User repaid Hassil for invoice {advance.Invoice.InvoiceNumber}.");

        ledgerService.Record(
            userId:           userId,
            type:             TransactionType.PlatformFee,
            direction:        TransactionDirection.Internal,
            amount:           advance.FeeAmount,
            invoiceId:        advance.InvoiceId,
            advanceRequestId: advance.Id,
            description:      "Platform fee collected at repayment.");

        AddTrustScoreEvent(advance.User, 10, "Advance repaid on time.");

        await dbContext.SaveChangesAsync(ct);
        return await GetAdvanceRequestAsync(userId, advance.Id, ct);
    }

    public async Task<AdvanceRequest> SimulateClientPaymentToHassilAsync(
        Guid userId,
        Guid advanceRequestId,
        CancellationToken ct = default)
    {
        var advance = await GetAdvanceRequestAsync(userId, advanceRequestId, ct);
        EnsureFinancingModel(advance, FinancingModel.InvoiceFactoring);

        await openBankingGateway.ReceiveClientPaymentToHassilAsync(
            clientId:  advance.Invoice.ClientId,
            invoiceId: advance.InvoiceId,
            amount:    advance.Invoice.Amount,
            currency:  advance.Invoice.Currency,
            ct:        ct);

        RunTransition(advance.MarkClientPaidHassil, "INVALID_ADVANCE_TRANSITION");

        ledgerService.Record(
            userId:           userId,
            type:             TransactionType.ClientPaymentToHassil,
            direction:        TransactionDirection.Credit,
            amount:           advance.Invoice.Amount,
            invoiceId:        advance.InvoiceId,
            advanceRequestId: advance.Id,
            description:      $"Client paid Hassil for invoice {advance.Invoice.InvoiceNumber}.");

        await dbContext.SaveChangesAsync(ct);
        return await GetAdvanceRequestAsync(userId, advance.Id, ct);
    }

    public async Task<AdvanceRequest> SimulateBufferReleaseAsync(
        Guid userId,
        Guid advanceRequestId,
        CancellationToken ct = default)
    {
        var advance = await GetAdvanceRequestAsync(userId, advanceRequestId, ct);
        EnsureFinancingModel(advance, FinancingModel.InvoiceFactoring);

        await openBankingGateway.ReleaseBufferToUserAsync(
            userId:      userId,
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
            "INVALID_ADVANCE_TRANSITION");

        ledgerService.Record(
            userId:           userId,
            type:             TransactionType.PlatformFee,
            direction:        TransactionDirection.Internal,
            amount:           advance.FeeAmount,
            invoiceId:        advance.InvoiceId,
            advanceRequestId: advance.Id,
            description:      "Platform fee collected from settlement.");

        ledgerService.Record(
            userId:           userId,
            type:             TransactionType.BufferRelease,
            direction:        TransactionDirection.Credit,
            amount:           advance.SettlementBufferAmount,
            invoiceId:        advance.InvoiceId,
            advanceRequestId: advance.Id,
            description:      $"Remaining settlement buffer released for invoice {advance.Invoice.InvoiceNumber}.");

        AddTrustScoreEvent(advance.User, 10, "Factoring advance completed with buffer release.");

        await dbContext.SaveChangesAsync(ct);
        return await GetAdvanceRequestAsync(userId, advance.Id, ct);
    }

    private IQueryable<AdvanceRequest> AdvanceQuery(Guid userId) =>
        dbContext.AdvanceRequests
            .Where(a => a.UserId == userId)
            .Include(a => a.User)
            .Include(a => a.Invoice)
            .ThenInclude(i => i.Client)
            .Include(a => a.Invoice)
            .ThenInclude(i => i.ClientConfirmation)
            .Include(a => a.Invoice)
            .ThenInclude(i => i.Documents)
            .Include(a => a.Transactions);

    private async Task<(User User, Invoice Invoice)> GetUserAndInvoiceAsync(
        Guid userId,
        Guid invoiceId,
        CancellationToken ct)
    {
        var user = await dbContext.Users
                       .FirstOrDefaultAsync(u => u.Id == userId, ct)
                   ?? throw new NotFoundException("User not found.", "USER_NOT_FOUND");

        var invoice = await dbContext.Invoices
                          .Include(i => i.Client)
                          .Include(i => i.Documents)
                          .Include(i => i.ClientConfirmation)
                          .Include(i => i.AdvanceRequest)
                          .FirstOrDefaultAsync(i => i.Id == invoiceId && i.UserId == userId, ct)
                      ?? throw new NotFoundException("Invoice not found.", "INVOICE_NOT_FOUND");

        return (user, invoice);
    }

    private static void EnsureInvoiceCanBeQuoted(Invoice invoice)
    {
        if (invoice.Status is InvoiceStatus.Cancelled or InvoiceStatus.Paid or InvoiceStatus.Rejected)
            throw new ConflictException(
                $"Invoice '{invoice.InvoiceNumber}' cannot be quoted from status '{invoice.Status}'.",
                "INVALID_INVOICE_STATUS");
    }

    private static void ApplyInitialDecision(
        User user,
        Invoice invoice,
        AdvanceRequest advanceRequest,
        AdvanceQuote quote,
        ReviewScoreResult review)
    {
        try
        {
            if (review.Score < 40)
            {
                advanceRequest.Reject("Review score below minimum threshold.");
                invoice.Reject();
                return;
            }

            if (quote.FinancingModel == FinancingModel.InvoiceFactoring
                && invoice.ClientConfirmation?.Status != ConfirmationStatus.Confirmed)
            {
                advanceRequest.MarkPendingClientConfirmation();
                invoice.RequireClientConfirmation();
                return;
            }

            invoice.SendToReview();

            if (review.Score >= 75
                && user.TrustScore >= 50)
            {
                advanceRequest.ApproveAutomatically();
                invoice.Approve();
            }
        }
        catch (InvalidOperationException ex)
        {
            throw new ConflictException(ex.Message, "INVALID_ADVANCE_TRANSITION");
        }
    }

    private static void EnsureFinancingModel(
        AdvanceRequest advance,
        FinancingModel expected)
    {
        if (advance.FinancingModel != expected)
            throw new ConflictException(
                $"Advance request '{advance.Id}' uses '{advance.FinancingModel}' and cannot run this simulation.",
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

    private void AddTrustScoreEvent(User user, int delta, string reason)
    {
        var trustScoreEvent = user.AdjustTrustScore(delta, reason);
        dbContext.TrustScoreEvents.Add(trustScoreEvent);
    }
}
