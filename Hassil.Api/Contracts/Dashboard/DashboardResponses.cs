using Hassil.Api.Contracts.Transactions;

namespace Hassil.Api.Contracts.Dashboard;

public record DashboardSummaryResponse(
    string AccountType,
    string FinancingModel,
    int TrustScore,
    decimal LedgerBalance,
    DashboardMoneyMetricResponse OutstandingInvoices,
    DashboardMoneyMetricResponse ActiveAdvances,
    DashboardMoneyMetricResponse ExpectedRepayments,
    DashboardReviewStateResponse ReviewStates,
    List<TransactionResponse> RecentTransactions);

public record DashboardMoneyMetricResponse(
    int Count,
    decimal Amount);

public record DashboardReviewStateResponse(
    int PendingClientConfirmation,
    int PendingReview,
    int ApprovedReadyForDisbursement);
