namespace Hassil.Api.Domain.Models;

public class TrustScoreEvent
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public int OldScore { get; private set; }
    public int NewScore { get; private set; }
    public string Reason { get; private set; } = null!;
    public DateTimeOffset CreatedAt { get; private set; }

    public int Delta => NewScore - OldScore;

    // Navigation Properties
    public User User { get; private set; } = null!;

    // Factory
    public static TrustScoreEvent Create(Guid userId, int oldScore, int newScore, string reason)
    {
        return new TrustScoreEvent
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            OldScore = NormalizeTrustScore(oldScore),
            NewScore = NormalizeTrustScore(newScore),
            Reason = Required(reason, nameof(reason)),
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    // Helpers
    private static int NormalizeTrustScore(int score) => Math.Clamp(score, 0, 100);

    private static string Required(string value, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException($"{parameterName} is required.", parameterName);

        return value.Trim();
    }
}
