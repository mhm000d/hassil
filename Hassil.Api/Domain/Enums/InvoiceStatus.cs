namespace Hassil.Api.Domain.Enums;

public enum InvoiceStatus
{
    Draft,
    Submitted,
    AdvanceRequested,
    PendingClientConfirmation,
    Confirmed,
    Disputed,
    PendingReview,
    Approved,
    Disbursed,
    Paid,
    Rejected,
    Cancelled
}
