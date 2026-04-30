using Hassil.Api.Domain.Enums;
using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.AdvanceRequests;

public class ReviewScoringService : IReviewScoringService
{
    public ReviewScoreResult Score(
        User user,
        Invoice invoice,
        AdvanceQuote quote,
        bool termsAccepted)
    {
        var score = 100;
        var flags = new List<string>();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var daysUntilDue = invoice.DueDate.DayNumber - today.DayNumber;

        if (user.Status != UserStatus.Active)
            Deduct(100, "User profile is suspended.");

        if (!termsAccepted)
            Deduct(100, "Terms were not accepted.");

        if (daysUntilDue < 0)
            Deduct(100, "Invoice due date is in the past.");
        else if (daysUntilDue > 90)
            Deduct(40, "Invoice due date is more than 90 days away.");

        if (user.TrustScore < 50)
            Deduct(20, "User trust score is below auto-approval threshold.");

        if (quote.AdvanceAmount > quote.MaxEligibleInvoiceAmount)
            Deduct(35, "Requested advance exceeds the trust-based funding limit.");
        else if (quote.AdvanceAmount >= quote.MaxEligibleInvoiceAmount * 0.9m)
            Deduct(10, "Requested advance is close to the current funding limit.");

        if (invoice.ClientConfirmation?.Status == ConfirmationStatus.Disputed)
            Deduct(100, "Client disputed the invoice.");

        if (quote.FinancingModel == FinancingModel.InvoiceFactoring
            && invoice.ClientConfirmation?.Status != ConfirmationStatus.Confirmed)
        {
            Deduct(35, "Client confirmation is required for factoring.");
        }

        if (quote.FinancingModel == FinancingModel.InvoiceDiscounting
            && invoice.ReceivableSource == ReceivableSource.FreelancePlatformPayout)
        {
            score += 5;
        }

        return new ReviewScoreResult(Math.Clamp(score, 0, 100), flags);

        void Deduct(int points, string flag)
        {
            score -= points;
            flags.Add(flag);
        }
    }
}
