namespace Hassil.Api.Services.OpenBanking;

public class MockOpenBankingGateway : IOpenBankingGateway
{
    public Task<BankTransferResult> PushAdvanceToUserAsync(
        Guid userId,
        decimal amount,
        string currency,
        string description,
        CancellationToken ct = default) =>
        Task.FromResult(Success(description));

    public Task<BankTransactionDetectionResult> DetectIncomingClientPaymentToUserAsync(
        Guid userId,
        Guid invoiceId,
        decimal expectedAmount,
        string currency,
        CancellationToken ct = default) =>
        Task.FromResult(new BankTransactionDetectionResult(
            Detected:          true,
            ProviderReference: CreateReference(),
            Amount:            expectedAmount,
            Currency:          currency,
            Description:       "Mock incoming client payment detected."));

    public Task<BankTransferResult> PullRepaymentFromUserAsync(
        Guid userId,
        decimal amount,
        string currency,
        string description,
        CancellationToken ct = default) =>
        Task.FromResult(Success(description));

    public Task<BankTransferResult> ReceiveClientPaymentToHassilAsync(
        Guid clientId,
        Guid invoiceId,
        decimal amount,
        string currency,
        CancellationToken ct = default) =>
        Task.FromResult(Success("Mock client payment received by Hassil."));

    public Task<BankTransferResult> ReleaseBufferToUserAsync(
        Guid userId,
        decimal amount,
        string currency,
        string description,
        CancellationToken ct = default) =>
        Task.FromResult(Success(description));

    private static BankTransferResult Success(string description) => new(
        Succeeded:          true,
        ProviderReference:  CreateReference(),
        Description:        description);

    private static string CreateReference() => $"mock-bank-{Guid.NewGuid():N}";
}
