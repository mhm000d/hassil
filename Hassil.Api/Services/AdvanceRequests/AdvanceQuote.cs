using Hassil.Api.Domain.Enums;

namespace Hassil.Api.Services.AdvanceRequests;

public record AdvanceQuote(
    Guid InvoiceId,
    FinancingModel FinancingModel,
    RepaymentParty RepaymentParty,
    PaymentDestination PaymentDestination,
    FeeCollectionTiming FeeCollectionTiming,
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
    IReadOnlyList<string> EligibilityMessages);

public record ReviewScoreResult(
    int Score,
    IReadOnlyList<string> RiskFlags);
