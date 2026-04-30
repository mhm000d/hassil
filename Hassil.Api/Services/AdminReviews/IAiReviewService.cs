using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.AdminReviews;

public interface IAiReviewService
{
    AiReviewSnapshot GenerateSnapshot(AdvanceRequest advanceRequest);
}
