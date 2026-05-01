using Hassil.Api.Contracts.Invoices;

namespace Hassil.Api.Contracts.AdvanceRequests;

public record AdvanceQuoteResponse(
    Guid InvoiceId,
    string FinancingModel,
    string RepaymentParty,
    string PaymentDestination,
    string FeeCollectionTiming,
    bool ClientNotificationRequired,
    bool ClientPaymentRedirectRequired,
    decimal RequestedPercent,
    decimal MaxAdvancePercent,
    decimal MaxEligibleInvoiceAmount,
    decimal AdvanceAmount,
    decimal FeeRate,
    decimal FeeAmount,
    decimal SettlementBufferAmount,
    decimal ExpectedRepaymentAmount,
    bool IsEligible,
    List<string> EligibilityMessages);

public record AdvanceRequestSummaryResponse(
    Guid Id,
    Guid InvoiceId,
    string InvoiceNumber,
    Guid UserId,
    string FinancingModel,
    decimal AdvanceAmount,
    decimal FeeAmount,
    decimal ExpectedRepaymentAmount,
    int ReviewScore,
    string Status,
    string? ClientConfirmationStatus,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public record AdvanceRequestResponse(
    Guid Id,
    InvoiceSummaryResponse Invoice,
    string FinancingModel,
    string RepaymentParty,
    string PaymentDestination,
    string FeeCollectionTiming,
    bool ClientNotificationRequired,
    bool ClientPaymentRedirectRequired,
    decimal RequestedPercent,
    decimal AdvanceAmount,
    decimal FeeRate,
    decimal FeeAmount,
    decimal SettlementBufferAmount,
    decimal ExpectedRepaymentAmount,
    int ReviewScore,
    string? ApprovalMode,
    string Status,
    string? ClientConfirmationToken,
    string? ClientConfirmationStatus,
    string? RejectionReason,
    DateTimeOffset? ReviewedAt,
    DateTimeOffset? TermsAcceptedAt,
    string TermsVersion,
    List<AdvanceTransactionResponse> Transactions,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public record AdvanceTransactionResponse(
    Guid Id,
    string Type,
    string Direction,
    decimal Amount,
    string? Description,
    DateTimeOffset CreatedAt);
