using Hassil.Api.Contracts.Dashboard;
using Hassil.Api.Services.Dashboard;

namespace Hassil.Api.Mappings;

public static class DashboardMappings
{
    public static DashboardSummaryResponse ToResponse(this DashboardSummary summary) => new(
        AccountType:         summary.AccountType,
        FinancingModel:      summary.FinancingModel,
        TrustScore:          summary.TrustScore,
        LedgerBalance:       summary.LedgerBalance,
        OutstandingInvoices: summary.OutstandingInvoices.ToResponse(),
        ActiveAdvances:      summary.ActiveAdvances.ToResponse(),
        ExpectedRepayments:  summary.ExpectedRepayments.ToResponse(),
        ReviewStates:        summary.ReviewStates.ToResponse(),
        RecentTransactions:  summary.RecentTransactions.Select(t => t.ToResponse()).ToList());

    public static DashboardMoneyMetricResponse ToResponse(this DashboardMoneyMetric metric) => new(
        Count:  metric.Count,
        Amount: metric.Amount);

    public static DashboardReviewStateResponse ToResponse(this DashboardReviewState reviewState) => new(
        PendingClientConfirmation:  reviewState.PendingClientConfirmation,
        PendingReview:              reviewState.PendingReview,
        ApprovedReadyForDisbursement: reviewState.ApprovedReadyForDisbursement);
}
