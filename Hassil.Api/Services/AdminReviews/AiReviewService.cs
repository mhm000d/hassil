using System.Text.Json;
using Hassil.Api.Domain.Enums;
using Hassil.Api.Domain.Models;
using Hassil.Api.Services.AdvanceRequests;

namespace Hassil.Api.Services.AdminReviews;

public class AiReviewService(IAdvanceCalculatorService calculator) : IAiReviewService
{
    public AiReviewSnapshot GenerateSnapshot(AdvanceRequest advanceRequest)
    {
        var flags = BuildRiskFlags(advanceRequest);
        var riskLevel = advanceRequest.ReviewScore switch
        {
            >= 75 => AiRiskLevel.Low,
            >= 50 => AiRiskLevel.Medium,
            _     => AiRiskLevel.High
        };

        var recommendedAction = riskLevel switch
        {
            AiRiskLevel.Low    => AiRecommendedAction.Approve,
            AiRiskLevel.Medium => AiRecommendedAction.ManualReview,
            _                  => AiRecommendedAction.Reject
        };

        var summary = BuildSummary(advanceRequest, riskLevel, recommendedAction, flags);

        return AiReviewSnapshot.Create(
            advanceRequestId:  advanceRequest.Id,
            riskLevel:         riskLevel,
            recommendedAction: recommendedAction,
            summary:           summary,
            riskFlagsJson:     JsonSerializer.Serialize(flags));
    }

    private List<string> BuildRiskFlags(AdvanceRequest advanceRequest)
    {
        var flags = new List<string>();
        var invoice = advanceRequest.Invoice;
        var daysUntilDue = invoice.DueDate.DayNumber - DateOnly.FromDateTime(DateTime.UtcNow).DayNumber;
        var quote = calculator.Calculate(advanceRequest.User, invoice, advanceRequest.RequestedPercent);

        flags.AddRange(quote.EligibilityMessages);

        if (advanceRequest.User.TrustScore < 50)
            flags.Add("User trust score is below auto-approval threshold.");

        if (advanceRequest.AdvanceAmount >= quote.MaxEligibleInvoiceAmount * 0.9m)
            flags.Add("Requested advance is close to the current trust-based funding limit.");

        if (daysUntilDue < 0)
            flags.Add("Invoice due date is in the past.");
        else if (daysUntilDue > 90)
            flags.Add("Invoice due date is more than 90 days away.");

        if (advanceRequest.FinancingModel == FinancingModel.InvoiceFactoring)
        {
            if (invoice.ClientConfirmation is null)
                flags.Add("Client confirmation has not been created.");
            else if (invoice.ClientConfirmation.Status != ConfirmationStatus.Confirmed)
                flags.Add($"Client confirmation is {invoice.ClientConfirmation.Status}.");
        }

        return flags.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static string BuildSummary(
        AdvanceRequest advanceRequest,
        AiRiskLevel riskLevel,
        AiRecommendedAction recommendedAction,
        IReadOnlyCollection<string> flags)
    {
        if (flags.Count == 0)
        {
            return
                $"{riskLevel} risk. Recommend {recommendedAction}: request score is {advanceRequest.ReviewScore}, " +
                "terms are accepted, and no major review flags were detected.";
        }

        return
            $"{riskLevel} risk. Recommend {recommendedAction}: request score is {advanceRequest.ReviewScore}. " +
            $"Main review flags: {string.Join("; ", flags.Take(3))}.";
    }
}
