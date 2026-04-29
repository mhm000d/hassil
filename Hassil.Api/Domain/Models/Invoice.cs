using Hassil.Api.Domain.Enums;

namespace Hassil.Api.Domain.Models;

public class Invoice
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid ClientId { get; private set; }
    public string InvoiceNumber { get; private set; } = null!;
    public ReceivableSource ReceivableSource { get; private set; }
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = null!;
    public DateOnly IssueDate { get; private set; }
    public DateOnly DueDate { get; private set; }
    public string? Description { get; private set; }
    public string? PaymentTerms { get; private set; }
    public InvoiceStatus Status { get; private set; }
    public string InvoiceFingerprint { get; private set; } = null!;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    // Navigation Properties
    public User User { get; private set; } = null!;
    public Client Client { get; private set; } = null!;
    public ICollection<InvoiceDocument> Documents { get; private set; } = [];
    public ClientConfirmation? ClientConfirmation { get; private set; }
    public AdvanceRequest? AdvanceRequest { get; private set; }
    public ICollection<Transaction> Transactions { get; private set; } = [];

    // Factory
    public static Invoice Create(
        Guid userId,
        Guid clientId,
        string invoiceNumber,
        decimal amount,
        DateOnly issueDate,
        DateOnly dueDate,
        string invoiceFingerprint,
        ReceivableSource receivableSource = ReceivableSource.DirectClientInvoice,
        string currency = "USD",
        string? description = null,
        string? paymentTerms = null)
    {
        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Invoice amount must be greater than zero.");

        if (dueDate < issueDate)
            throw new ArgumentException("Due date cannot be before issue date.", nameof(dueDate));

        var now = DateTimeOffset.UtcNow;

        return new Invoice
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ClientId = clientId,
            InvoiceNumber = Required(invoiceNumber, nameof(invoiceNumber)),
            ReceivableSource = receivableSource,
            Amount = amount,
            Currency = Required(currency, nameof(currency)).ToUpperInvariant(),
            IssueDate = issueDate,
            DueDate = dueDate,
            Description = Optional(description),
            PaymentTerms = Optional(paymentTerms),
            Status = InvoiceStatus.Draft,
            InvoiceFingerprint = Required(invoiceFingerprint, nameof(invoiceFingerprint)),
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    // State Machine
    public void Submit()
    {
        EnsureTransition(to: InvoiceStatus.Submitted, InvoiceStatus.Draft);
        Status = InvoiceStatus.Submitted;
        Touch();
    }

    public void MarkAdvanceRequested()
    {
        EnsureTransition(to: InvoiceStatus.AdvanceRequested, InvoiceStatus.Submitted);
        Status = InvoiceStatus.AdvanceRequested;
        Touch();
    }

    public void RequireClientConfirmation()
    {
        EnsureTransition(to: InvoiceStatus.PendingClientConfirmation, InvoiceStatus.AdvanceRequested);
        Status = InvoiceStatus.PendingClientConfirmation;
        Touch();
    }

    public void MarkConfirmed()
    {
        EnsureTransition(to: InvoiceStatus.Confirmed, InvoiceStatus.PendingClientConfirmation);
        Status = InvoiceStatus.Confirmed;
        Touch();
    }

    public void MarkDisputed()
    {
        EnsureTransition(to: InvoiceStatus.Disputed, InvoiceStatus.PendingClientConfirmation);
        Status = InvoiceStatus.Disputed;
        Touch();
    }

    public void SendToReview()
    {
        EnsureTransition(to: InvoiceStatus.PendingReview, InvoiceStatus.AdvanceRequested, InvoiceStatus.Confirmed);
        Status = InvoiceStatus.PendingReview;
        Touch();
    }

    public void Approve()
    {
        EnsureTransition(to: InvoiceStatus.Approved, InvoiceStatus.PendingReview, InvoiceStatus.Confirmed);
        Status = InvoiceStatus.Approved;
        Touch();
    }

    public void Reject()
    {
        if (Status is InvoiceStatus.Paid or InvoiceStatus.Cancelled)
            throw new InvalidOperationException($"Invoice '{InvoiceNumber}' cannot be rejected from status '{Status}'.");

        Status = InvoiceStatus.Rejected;
        Touch();
    }

    public void MarkDisbursed()
    {
        EnsureTransition(to: InvoiceStatus.Disbursed, InvoiceStatus.Approved);
        Status = InvoiceStatus.Disbursed;
        Touch();
    }

    public void MarkPaid()
    {
        EnsureTransition(to: InvoiceStatus.Paid, InvoiceStatus.Disbursed, InvoiceStatus.Approved);
        Status = InvoiceStatus.Paid;
        Touch();
    }

    public void Cancel(bool isAdmin = false)
    {
        var canCancel = isAdmin
            ? Status != InvoiceStatus.Paid
            : Status is InvoiceStatus.Draft or InvoiceStatus.Submitted or InvoiceStatus.AdvanceRequested;

        if (!canCancel)
            throw new InvalidOperationException($"Invoice '{InvoiceNumber}' cannot be cancelled from status '{Status}'.");

        Status = InvoiceStatus.Cancelled;
        Touch();
    }

    public void UpdateDetails(
        decimal amount,
        DateOnly issueDate,
        DateOnly dueDate,
        string? description = null,
        string? paymentTerms = null)
    {
        if (Status != InvoiceStatus.Draft)
            throw new InvalidOperationException($"Invoice '{InvoiceNumber}' can only be edited while in Draft status.");

        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Invoice amount must be greater than zero.");

        if (dueDate < issueDate)
            throw new ArgumentException("Due date cannot be before issue date.", nameof(dueDate));

        Amount = amount;
        IssueDate = issueDate;
        DueDate = dueDate;
        Description = Optional(description);
        PaymentTerms = Optional(paymentTerms);
        Touch();
    }

    public void AddDocument(InvoiceDocument document) => Documents.Add(document);

    public void AttachClientConfirmation(ClientConfirmation clientConfirmation) => ClientConfirmation = clientConfirmation;

    public void AttachAdvanceRequest(AdvanceRequest advanceRequest) => AdvanceRequest = advanceRequest;

    public void AddTransaction(Transaction transaction) => Transactions.Add(transaction);

    // Helpers
    private void EnsureTransition(InvoiceStatus to, params InvoiceStatus[] allowedFrom)
    {
        if (!allowedFrom.Contains(Status))
            throw new InvalidOperationException(
                $"Invalid invoice transition: '{Status}' to '{to}'. Expected current status: {string.Join(", ", allowedFrom)}.");
    }

    private static string Required(string value, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException($"{parameterName} is required.", parameterName);

        return value.Trim();
    }

    private static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private void Touch() => UpdatedAt = DateTimeOffset.UtcNow;
}
