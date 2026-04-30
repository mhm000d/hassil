using Hassil.Api.Contracts.Dashboard;

namespace Hassil.Api.Services.Dashboard;

public interface IDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(Guid userId, CancellationToken ct = default);
}
