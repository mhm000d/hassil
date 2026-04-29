using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.Dashboard;

public record DashboardSummary(
    string AccountType,
    string FinancingModel,
    int TrustScore,
    decimal LedgerBalance,
    DashboardMoneyMetric OutstandingInvoices,
    DashboardMoneyMetric ActiveAdvances,
    DashboardMoneyMetric ExpectedRepayments,
    DashboardReviewState ReviewStates,
    IReadOnlyList<Transaction> RecentTransactions);

public record DashboardMoneyMetric(
    int Count,
    decimal Amount);

public record DashboardReviewState(
    int PendingClientConfirmation,
    int PendingReview,
    int ApprovedReadyForDisbursement);
