using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.AdvanceRequests;

public interface IReviewScoringService
{
    ReviewScoreResult Score(
        User user,
        Invoice invoice,
        AdvanceQuote quote,
        bool termsAccepted);
}
