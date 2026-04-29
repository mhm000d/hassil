using Hassil.Api.Domain.Enums;

namespace Hassil.Api.Domain.Models;

public class Transaction
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid? InvoiceId { get; private set; }
    public Guid? AdvanceRequestId { get; private set; }
    public TransactionType Type { get; private set; }
    public TransactionDirection Direction { get; private set; }
    public decimal Amount { get; private set; }
    public string? Description { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    // Navigation Properties
    public User User { get; private set; } = null!;
    public Invoice? Invoice { get; private set; }
    public AdvanceRequest? AdvanceRequest { get; private set; }

    // Factory
    public static Transaction Create(
        Guid userId,
        TransactionType type,
        TransactionDirection direction,
        decimal amount,
        Guid? invoiceId = null,
        Guid? advanceRequestId = null,
        string? description = null)
    {
        if (amount < 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Transaction amount cannot be negative.");

        return new Transaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            InvoiceId = invoiceId,
            AdvanceRequestId = advanceRequestId,
            Type = type,
            Direction = direction,
            Amount = amount,
            Description = Optional(description),
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void UpdateDescription(string? description)
    {
        Description = Optional(description);
    }

    // Helpers
    private static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
