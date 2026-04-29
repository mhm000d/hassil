using System.Text.Json;
using Hassil.Api.Contracts.AdminReviews;
using Hassil.Api.Domain.Models;
using Hassil.Api.Services.AdminReviews;

namespace Hassil.Api.Mappings;

public static class AdminReviewMappings
{
    public static AdminAdvanceRequestDetailResponse ToResponse(this AdminReviewDetail detail) => new(
        AdvanceRequest:        detail.AdvanceRequest.ToResponse(),
        VerificationChecklist: detail.VerificationChecklist.Select(i => i.ToResponse()).ToList(),
        LatestAiReview:        detail.LatestAiReview?.ToResponse(),
        AdminReviews:          detail.AdvanceRequest.AdminReviews
                                   .OrderByDescending(r => r.CreatedAt)
                                   .Select(r => r.ToResponse())
                                   .ToList());

    public static ReviewChecklistItemResponse ToResponse(this ReviewChecklistItem item) => new(
        Label:  item.Label,
        Passed: item.Passed,
        Detail: item.Detail);

    public static AiReviewSnapshotResponse ToResponse(this AiReviewSnapshot snapshot) => new(
        Id:                snapshot.Id,
        RiskLevel:         snapshot.RiskLevel.ToString(),
        RecommendedAction: snapshot.RecommendedAction.ToString(),
        Summary:           snapshot.Summary,
        RiskFlags:         ParseRiskFlags(snapshot.RiskFlagsJson),
        ModelName:         snapshot.ModelName,
        CreatedAt:         snapshot.CreatedAt);

    public static AdminReviewResponse ToResponse(this AdminReview review) => new(
        Id:             review.Id,
        ReviewerUserId: review.ReviewerUserId,
        Decision:       review.Decision.ToString(),
        Notes:          review.Notes,
        CreatedAt:      review.CreatedAt);

    private static List<string> ParseRiskFlags(string riskFlagsJson)
    {
        try
        {
            return JsonSerializer.Deserialize<List<string>>(riskFlagsJson) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
