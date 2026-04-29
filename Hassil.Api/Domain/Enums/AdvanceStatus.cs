namespace Hassil.Api.Domain.Enums;

public enum AdvanceStatus
{
    PendingClientConfirmation,
    PendingReview,
    Approved,
    Rejected,
    Disbursed,
    ClientPaymentDetected,
    ClientPaidHassil,
    BufferReleased,
    Repaid,
    Defaulted
}
