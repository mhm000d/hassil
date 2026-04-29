namespace Hassil.Api.Services.Dashboard;

public interface IDashboardService
{
    Task<DashboardSummary> GetSummaryAsync(
        Guid userId,
        CancellationToken ct = default);
}
