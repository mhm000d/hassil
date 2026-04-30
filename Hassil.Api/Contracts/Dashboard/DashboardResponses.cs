namespace Hassil.Api.Contracts.Dashboard;

public record DashboardSummaryResponse(
    decimal TotalBalance,
    decimal OutstandingInvoices,
    decimal ActiveAdvances,
    int TrustScore);
