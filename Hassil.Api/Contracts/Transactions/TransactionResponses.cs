namespace Hassil.Api.Contracts.Transactions;

public record TransactionResponse(
    Guid Id,
    Guid? InvoiceId,
    string? InvoiceNumber,
    Guid? AdvanceRequestId,
    string Type,
    string Direction,
    decimal Amount,
    string? Description,
    DateTimeOffset CreatedAt);
