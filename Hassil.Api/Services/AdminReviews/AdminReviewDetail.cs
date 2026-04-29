using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.AdminReviews;

public record AdminReviewDetail(
    AdvanceRequest AdvanceRequest,
    IReadOnlyList<ReviewChecklistItem> VerificationChecklist,
    AiReviewSnapshot? LatestAiReview);

public record ReviewChecklistItem(
    string Label,
    bool Passed,
    string? Detail);
