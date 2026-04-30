namespace Hassil.Api.Contracts.Transactions;

public record TransactionResponse(
    Guid Id,
    string Type,
    string Direction,
    decimal Amount,
    string? Description,
    DateTimeOffset CreatedAt);
