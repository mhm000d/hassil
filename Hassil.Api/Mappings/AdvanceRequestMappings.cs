using Hassil.Api.Contracts.AdvanceRequests;
using Hassil.Api.Domain.Models;
using Hassil.Api.Services.AdvanceRequests;

namespace Hassil.Api.Mappings;

public static class AdvanceRequestMappings
{
    public static AdvanceQuoteResponse ToResponse(this AdvanceQuote quote) => new(
        InvoiceId:                     quote.InvoiceId,
        FinancingModel:                quote.FinancingModel.ToString(),
        RepaymentParty:                quote.RepaymentParty.ToString(),
        PaymentDestination:            quote.PaymentDestination.ToString(),
        FeeCollectionTiming:           quote.FeeCollectionTiming.ToString(),
        ClientNotificationRequired:    quote.ClientNotificationRequired,
        ClientPaymentRedirectRequired: quote.ClientPaymentRedirectRequired,
        RequestedPercent:              quote.RequestedPercent,
        MaxAdvancePercent:             quote.MaxAdvancePercent,
        MaxEligibleInvoiceAmount:      quote.MaxEligibleInvoiceAmount,
        AdvanceAmount:                 quote.AdvanceAmount,
        FeeRate:                       quote.FeeRate,
        FeeAmount:                     quote.FeeAmount,
        SettlementBufferAmount:        quote.SettlementBufferAmount,
        ExpectedRepaymentAmount:       quote.ExpectedRepaymentAmount,
        IsEligible:                    quote.IsEligible,
        EligibilityMessages:           quote.EligibilityMessages.ToList());

    public static AdvanceRequestSummaryResponse ToSummaryResponse(this AdvanceRequest request) => new(
        Id:                      request.Id,
        InvoiceId:               request.InvoiceId,
        InvoiceNumber:           request.Invoice.InvoiceNumber,
        UserId:                  request.UserId,
        FinancingModel:          request.FinancingModel.ToString(),
        AdvanceAmount:           request.AdvanceAmount,
        FeeAmount:               request.FeeAmount,
        ExpectedRepaymentAmount: request.ExpectedRepaymentAmount,
        ReviewScore:             request.ReviewScore,
        Status:                  request.Status.ToString(),
        ClientConfirmationStatus: request.Invoice.ClientConfirmation?.Status.ToString(),
        CreatedAt:               request.CreatedAt,
        UpdatedAt:               request.UpdatedAt);

    public static AdvanceRequestResponse ToResponse(this AdvanceRequest request) => new(
        Id:                            request.Id,
        Invoice:                       request.Invoice.ToSummaryResponse(),
        FinancingModel:                request.FinancingModel.ToString(),
        RepaymentParty:                request.RepaymentParty.ToString(),
        PaymentDestination:            request.PaymentDestination.ToString(),
        FeeCollectionTiming:           request.FeeCollectionTiming.ToString(),
        ClientNotificationRequired:    request.ClientNotificationRequired,
        ClientPaymentRedirectRequired: request.ClientPaymentRedirectRequired,
        RequestedPercent:              request.RequestedPercent,
        AdvanceAmount:                 request.AdvanceAmount,
        FeeRate:                       request.FeeRate,
        FeeAmount:                     request.FeeAmount,
        SettlementBufferAmount:        request.SettlementBufferAmount,
        ExpectedRepaymentAmount:       request.ExpectedRepaymentAmount,
        ReviewScore:                   request.ReviewScore,
        ApprovalMode:                  request.ApprovalMode?.ToString(),
        Status:                        request.Status.ToString(),
        ClientConfirmationToken:       request.Invoice.ClientConfirmation?.Token,
        ClientConfirmationStatus:      request.Invoice.ClientConfirmation?.Status.ToString(),
        RejectionReason:               request.RejectionReason,
        ReviewedAt:                    request.ReviewedAt,
        TermsAcceptedAt:               request.TermsAcceptedAt,
        TermsVersion:                  request.TermsVersion,
        Transactions:                  request.Transactions.Select(t => t.ToAdvanceResponse()).ToList(),
        CreatedAt:                     request.CreatedAt,
        UpdatedAt:                     request.UpdatedAt);

    public static AdvanceTransactionResponse ToAdvanceResponse(this Transaction transaction) => new(
        Id:          transaction.Id,
        Type:        transaction.Type.ToString(),
        Direction:   transaction.Direction.ToString(),
        Amount:      transaction.Amount,
        Description: transaction.Description,
        CreatedAt:   transaction.CreatedAt);
}
