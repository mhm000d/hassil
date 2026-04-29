namespace Hassil.Api.Services.OpenBanking;

public interface IOpenBankingGateway
{
    Task<BankTransferResult> PushAdvanceToUserAsync(
        Guid userId,
        decimal amount,
        string currency,
        string description,
        CancellationToken ct = default);

    Task<BankTransactionDetectionResult> DetectIncomingClientPaymentToUserAsync(
        Guid userId,
        Guid invoiceId,
        decimal expectedAmount,
        string currency,
        CancellationToken ct = default);

    Task<BankTransferResult> PullRepaymentFromUserAsync(
        Guid userId,
        decimal amount,
        string currency,
        string description,
        CancellationToken ct = default);

    Task<BankTransferResult> ReceiveClientPaymentToHassilAsync(
        Guid clientId,
        Guid invoiceId,
        decimal amount,
        string currency,
        CancellationToken ct = default);

    Task<BankTransferResult> ReleaseBufferToUserAsync(
        Guid userId,
        decimal amount,
        string currency,
        string description,
        CancellationToken ct = default);
}

public record BankTransferResult(
    bool Succeeded,
    string ProviderReference,
    string Description);

public record BankTransactionDetectionResult(
    bool Detected,
    string ProviderReference,
    decimal Amount,
    string Currency,
    string Description);
