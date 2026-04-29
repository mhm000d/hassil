namespace Hassil.Api.Contracts.TrustScores;

public record TrustScoreHistoryResponse(
    int CurrentScore,
    List<TrustScoreEventResponse> Events);

public record TrustScoreEventResponse(
    Guid Id,
    int OldScore,
    int NewScore,
    int Delta,
    string Reason,
    DateTimeOffset CreatedAt);
