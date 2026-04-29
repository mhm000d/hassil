using Hassil.Api.Domain.Enums;

namespace Hassil.Api.Domain.Models;

public class ClientConfirmation
{
    public Guid Id { get; private set; }
    public Guid InvoiceId { get; private set; }
    public string Token { get; private set; } = null!;
    public string ClientEmail { get; private set; } = null!;
    public ConfirmationStatus Status { get; private set; }
    public string? ClientNote { get; private set; }
    public DateTimeOffset? RespondedAt { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }

    // Navigation Properties
    public Invoice Invoice { get; private set; } = null!;

    // Factory
    public static ClientConfirmation Create(
        Guid invoiceId,
        string token,
        string clientEmail,
        DateTimeOffset expiresAt)
    {
        if (expiresAt <= DateTimeOffset.UtcNow)
            throw new ArgumentException("Confirmation expiration must be in the future.", nameof(expiresAt));

        return new ClientConfirmation
        {
            Id = Guid.NewGuid(),
            InvoiceId = invoiceId,
            Token = Required(token, nameof(token)),
            ClientEmail = Required(clientEmail, nameof(clientEmail)),
            Status = ConfirmationStatus.Pending,
            ExpiresAt = expiresAt
        };
    }

    // State Machine
    public void Confirm(string? note = null)
    {
        EnsurePending(to: ConfirmationStatus.Confirmed);
        EnsureNotExpired();

        Status = ConfirmationStatus.Confirmed;
        ClientNote = Optional(note);
        RespondedAt = DateTimeOffset.UtcNow;
    }

    public void Dispute(string? note = null)
    {
        EnsurePending(to: ConfirmationStatus.Disputed);
        EnsureNotExpired();

        Status = ConfirmationStatus.Disputed;
        ClientNote = Optional(note);
        RespondedAt = DateTimeOffset.UtcNow;
    }

    public void ExtendExpiration(DateTimeOffset expiresAt)
    {
        if (Status != ConfirmationStatus.Pending)
            throw new InvalidOperationException($"Client confirmation cannot be extended from status '{Status}'.");

        if (expiresAt <= ExpiresAt)
            throw new ArgumentException("New expiration must be later than the current expiration.", nameof(expiresAt));

        ExpiresAt = expiresAt;
    }

    // Helpers
    private void EnsurePending(ConfirmationStatus to)
    {
        if (Status != ConfirmationStatus.Pending)
            throw new InvalidOperationException(
                $"Invalid confirmation transition: '{Status}' to '{to}'. Expected current status: '{ConfirmationStatus.Pending}'.");
    }

    private void EnsureNotExpired()
    {
        if (DateTimeOffset.UtcNow > ExpiresAt)
            throw new InvalidOperationException("Client confirmation token has expired.");
    }

    private static string Required(string value, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException($"{parameterName} is required.", parameterName);

        return value.Trim();
    }

    private static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
