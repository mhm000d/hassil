namespace Hassil.Api.Domain.Enums;

public enum TransactionType
{
    AdvanceDisbursement,
    DetectedIncomingPayment,
    UserRepayment,
    ClientPaymentToHassil,
    PlatformFee,
    BufferRelease,
    TrustScoreAdjustment
}
