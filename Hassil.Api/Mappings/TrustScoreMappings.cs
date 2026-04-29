using Hassil.Api.Contracts.TrustScores;
using Hassil.Api.Domain.Models;
using Hassil.Api.Services.TrustScores;

namespace Hassil.Api.Mappings;

public static class TrustScoreMappings
{
    public static TrustScoreHistoryResponse ToResponse(this TrustScoreHistory history) => new(
        CurrentScore: history.CurrentScore,
        Events:       history.Events.Select(e => e.ToResponse()).ToList());

    public static TrustScoreEventResponse ToResponse(this TrustScoreEvent trustScoreEvent) => new(
        Id:        trustScoreEvent.Id,
        OldScore:  trustScoreEvent.OldScore,
        NewScore:  trustScoreEvent.NewScore,
        Delta:     trustScoreEvent.Delta,
        Reason:    trustScoreEvent.Reason,
        CreatedAt: trustScoreEvent.CreatedAt);
}
