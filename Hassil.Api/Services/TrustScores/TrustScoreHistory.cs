using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.TrustScores;

public record TrustScoreHistory(
    int CurrentScore,
    IReadOnlyList<TrustScoreEvent> Events);
