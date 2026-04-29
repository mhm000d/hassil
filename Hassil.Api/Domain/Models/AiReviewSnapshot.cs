using Hassil.Api.Domain.Enums;

namespace Hassil.Api.Domain.Models;

public class AiReviewSnapshot
{
    public Guid Id { get; private set; }
    public Guid AdvanceRequestId { get; private set; }
    public AiRiskLevel RiskLevel { get; private set; }
    public AiRecommendedAction RecommendedAction { get; private set; }
    public string Summary { get; private set; } = null!;
    public string RiskFlagsJson { get; private set; } = null!;
    public string ModelName { get; private set; } = null!;
    public DateTimeOffset CreatedAt { get; private set; }

    // Navigation Properties
    public AdvanceRequest AdvanceRequest { get; private set; } = null!;

    // Factory
    public static AiReviewSnapshot Create(
        Guid advanceRequestId,
        AiRiskLevel riskLevel,
        AiRecommendedAction recommendedAction,
        string summary,
        string riskFlagsJson = "[]",
        string modelName = "mock-ai-review-v1")
    {
        return new AiReviewSnapshot
        {
            Id = Guid.NewGuid(),
            AdvanceRequestId = advanceRequestId,
            RiskLevel = riskLevel,
            RecommendedAction = recommendedAction,
            Summary = Required(summary, nameof(summary)),
            RiskFlagsJson = Required(riskFlagsJson, nameof(riskFlagsJson)),
            ModelName = Required(modelName, nameof(modelName)),
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void UpdateSummary(string summary)
    {
        Summary = Required(summary, nameof(summary));
    }

    // Helpers
    private static string Required(string value, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException($"{parameterName} is required.", parameterName);

        return value.Trim();
    }
}
