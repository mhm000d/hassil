using Hassil.Api.Database;
using Hassil.Api.Domain.Enums;
using Hassil.Api.Domain.Models;
using Hassil.Api.Exceptions;
using Hassil.Api.Services.AdvanceRequests;
using Microsoft.EntityFrameworkCore;

namespace Hassil.Api.Services.ClientConfirmations;

public class ClientConfirmationService(
    HassilDbContext dbContext,
    IAdvanceCalculatorService calculator,
    IReviewScoringService reviewScoringService,
    ILogger<ClientConfirmationService> logger) : IClientConfirmationService
{
    public async Task<ClientConfirmation> GetAsync(
        string token,
        CancellationToken ct = default)
    {
        return await ConfirmationQuery()
                   .FirstOrDefaultAsync(c => c.Token == token, ct)
               ?? throw new NotFoundException("Client confirmation not found.", "CLIENT_CONFIRMATION_NOT_FOUND");
    }

    public async Task<ClientConfirmation> ConfirmAsync(
        string token,
        string? note,
        CancellationToken ct = default)
    {
        var confirmation = await GetAsync(token, ct);
        var invoice = confirmation.Invoice;
        var advance = invoice.AdvanceRequest
                      ?? throw new NotFoundException(
                          "Advance request not found for this confirmation.",
                          "ADVANCE_REQUEST_NOT_FOUND");

        RunTransition(
            () =>
            {
                confirmation.Confirm(note);
                invoice.MarkConfirmed();
                advance.MarkPendingReview();
                invoice.SendToReview();
            },
            "INVALID_CLIENT_CONFIRMATION_TRANSITION");

        var quote = calculator.Calculate(advance.User, invoice, advance.RequestedPercent);
        var review = reviewScoringService.Score(
            advance.User,
            invoice,
            quote,
            termsAccepted: advance.TermsAcceptedAt.HasValue);

        advance.UpdateReviewScore(review.Score);

        if (review.Score >= 75
            && advance.User.TrustScore >= 50)
        {
            RunTransition(
                () =>
                {
                    advance.ApproveAutomatically();
                    invoice.Approve();
                },
                "INVALID_ADVANCE_TRANSITION");
        }

        AddTrustScoreEvent(advance.User, 5, "Client confirmed factoring invoice.");

        await dbContext.SaveChangesAsync(ct);

        logger.LogInformation(
            "Client confirmed invoice. ConfirmationId={ConfirmationId} InvoiceId={InvoiceId} AdvanceRequestId={AdvanceRequestId}",
            confirmation.Id,
            invoice.Id,
            advance.Id);

        return await GetAsync(token, ct);
    }

    public async Task<ClientConfirmation> DisputeAsync(
        string token,
        string? note,
        CancellationToken ct = default)
    {
        var confirmation = await GetAsync(token, ct);
        var invoice = confirmation.Invoice;
        var advance = invoice.AdvanceRequest
                      ?? throw new NotFoundException(
                          "Advance request not found for this confirmation.",
                          "ADVANCE_REQUEST_NOT_FOUND");

        RunTransition(
            () =>
            {
                confirmation.Dispute(note);
                invoice.MarkDisputed();
                advance.Reject("Client disputed invoice.", reviewedBy: null);
            },
            "INVALID_CLIENT_CONFIRMATION_TRANSITION");

        AddTrustScoreEvent(advance.User, -20, "Client disputed factoring invoice.");

        await dbContext.SaveChangesAsync(ct);

        logger.LogInformation(
            "Client disputed invoice. ConfirmationId={ConfirmationId} InvoiceId={InvoiceId} AdvanceRequestId={AdvanceRequestId}",
            confirmation.Id,
            invoice.Id,
            advance.Id);

        return await GetAsync(token, ct);
    }

    private IQueryable<ClientConfirmation> ConfirmationQuery() =>
        dbContext.ClientConfirmations
            .Include(c => c.Invoice)
            .ThenInclude(i => i.Client)
            .Include(c => c.Invoice)
            .ThenInclude(i => i.Documents)
            .Include(c => c.Invoice)
            .ThenInclude(i => i.AdvanceRequest)
            .ThenInclude(a => a!.User);

    private void AddTrustScoreEvent(User user, int delta, string reason)
    {
        var trustScoreEvent = user.AdjustTrustScore(delta, reason);
        dbContext.TrustScoreEvents.Add(trustScoreEvent);
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
