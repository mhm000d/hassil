using Hassil.Api.Contracts.AdvanceRequests;

namespace Hassil.Api.Contracts.AdminReviews;

public record AdminAdvanceRequestDetailResponse(
    AdvanceRequestResponse AdvanceRequest,
    List<ReviewChecklistItemResponse> VerificationChecklist,
    AiReviewSnapshotResponse? LatestAiReview,
    List<AdminReviewResponse> AdminReviews);

public record ReviewChecklistItemResponse(
    string Label,
    bool Passed,
    string? Detail);

public record AiReviewSnapshotResponse(
    Guid Id,
    string RiskLevel,
    string RecommendedAction,
    string Summary,
    List<string> RiskFlags,
    string ModelName,
    DateTimeOffset CreatedAt);

public record AdminReviewResponse(
    Guid Id,
    Guid ReviewerUserId,
    string Decision,
    string? Notes,
    DateTimeOffset CreatedAt);
