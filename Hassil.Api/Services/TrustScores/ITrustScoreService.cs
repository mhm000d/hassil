namespace Hassil.Api.Services.TrustScores;

public interface ITrustScoreService
{
    Task<TrustScoreHistory> GetHistoryAsync(
        Guid userId,
        CancellationToken ct = default);
}
