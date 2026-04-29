using Hassil.Api.Domain.Enums;
using ApprovalModeEnum = Hassil.Api.Domain.Enums.ApprovalMode;

namespace Hassil.Api.Domain.Models;

public class AdvanceRequest
{
    public Guid Id { get; private set; }
    public Guid InvoiceId { get; private set; }
    public Guid UserId { get; private set; }
    public FinancingModel FinancingModel { get; private set; }
    public RepaymentParty RepaymentParty { get; private set; }
    public PaymentDestination PaymentDestination { get; private set; }
    public FeeCollectionTiming FeeCollectionTiming { get; private set; }
    public bool ClientNotificationRequired { get; private set; }
    public bool ClientPaymentRedirectRequired { get; private set; }
    public decimal RequestedPercent { get; private set; }
    public decimal AdvanceAmount { get; private set; }
    public decimal FeeRate { get; private set; }
    public decimal FeeAmount { get; private set; }
    public decimal SettlementBufferAmount { get; private set; }
    public decimal ExpectedRepaymentAmount { get; private set; }
    public int ReviewScore { get; private set; }
    public ApprovalModeEnum? ApprovalMode { get; private set; }
    public AdvanceStatus Status { get; private set; }
    public string? RejectionReason { get; private set; }
    public Guid? ReviewedBy { get; private set; }
    public DateTimeOffset? ReviewedAt { get; private set; }
    public DateTimeOffset? TermsAcceptedAt { get; private set; }
    public string TermsVersion { get; private set; } = null!;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    // Navigation Properties
    public Invoice Invoice { get; private set; } = null!;
    public User User { get; private set; } = null!;
    public ICollection<Transaction> Transactions { get; private set; } = [];
    public ICollection<AiReviewSnapshot> AiReviewSnapshots { get; private set; } = [];
    public ICollection<AdminReview> AdminReviews { get; private set; } = [];

    // Factory
    public static AdvanceRequest Create(
        Guid invoiceId,
        Guid userId,
        FinancingModel financingModel,
        decimal requestedPercent,
        decimal advanceAmount,
        decimal feeRate,
        decimal feeAmount,
        decimal settlementBufferAmount,
        decimal expectedRepaymentAmount,
        int reviewScore,
        AdvanceStatus status = AdvanceStatus.PendingReview,
        string termsVersion = "hackathon-v1")
    {
        ValidatePercent(requestedPercent, nameof(requestedPercent));
        ValidateRate(feeRate, nameof(feeRate));
        ValidateMoney(advanceAmount, nameof(advanceAmount));
        ValidateMoney(feeAmount, nameof(feeAmount), allowZero: true);
        ValidateMoney(settlementBufferAmount, nameof(settlementBufferAmount), allowZero: true);
        ValidateMoney(expectedRepaymentAmount, nameof(expectedRepaymentAmount));

        var isFactoring = financingModel == FinancingModel.InvoiceFactoring;
        var now = DateTimeOffset.UtcNow;

        return new AdvanceRequest
        {
            Id = Guid.NewGuid(),
            InvoiceId = invoiceId,
            UserId = userId,
            FinancingModel = financingModel,
            RepaymentParty = isFactoring ? RepaymentParty.Client : RepaymentParty.User,
            PaymentDestination = isFactoring ? PaymentDestination.HassilCollectionAccount : PaymentDestination.UserBankAccount,
            FeeCollectionTiming = isFactoring ? FeeCollectionTiming.FromSettlementBuffer : FeeCollectionTiming.AtUserRepayment,
            ClientNotificationRequired = isFactoring,
            ClientPaymentRedirectRequired = isFactoring,
            RequestedPercent = requestedPercent,
            AdvanceAmount = advanceAmount,
            FeeRate = feeRate,
            FeeAmount = feeAmount,
            SettlementBufferAmount = settlementBufferAmount,
            ExpectedRepaymentAmount = expectedRepaymentAmount,
            ReviewScore = NormalizeReviewScore(reviewScore),
            Status = status,
            TermsVersion = Required(termsVersion, nameof(termsVersion)),
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    // State Machine
    public void AcceptTerms(string termsVersion = "hackathon-v1")
    {
        TermsVersion = Required(termsVersion, nameof(termsVersion));
        TermsAcceptedAt = DateTimeOffset.UtcNow;
        Touch();
    }

    public void MarkPendingClientConfirmation()
    {
        if (!ClientNotificationRequired)
            throw new InvalidOperationException("Only factoring advances require client confirmation.");

        EnsureTransition(to: AdvanceStatus.PendingClientConfirmation, AdvanceStatus.PendingReview);
        Status = AdvanceStatus.PendingClientConfirmation;
        Touch();
    }

    public void MarkPendingReview()
    {
        EnsureTransition(to: AdvanceStatus.PendingReview, AdvanceStatus.PendingClientConfirmation);
        Status = AdvanceStatus.PendingReview;
        Touch();
    }

    public void ApproveAutomatically()
    {
        Approve(ApprovalModeEnum.Auto, reviewedBy: null);
    }

    public void ApproveManually(Guid reviewerUserId)
    {
        Approve(ApprovalModeEnum.Manual, reviewerUserId);
    }

    public void Reject(string reason, Guid? reviewedBy = null)
    {
        if (Status is AdvanceStatus.Disbursed
            or AdvanceStatus.ClientPaymentDetected
            or AdvanceStatus.ClientPaidHassil
            or AdvanceStatus.BufferReleased
            or AdvanceStatus.Repaid
            or AdvanceStatus.Defaulted)
        {
            throw new InvalidOperationException($"Advance request '{Id}' cannot be rejected from status '{Status}'.");
        }

        Status = AdvanceStatus.Rejected;
        ApprovalMode = reviewedBy.HasValue ? ApprovalModeEnum.Manual : ApprovalMode;
        ReviewedBy = reviewedBy;
        ReviewedAt = DateTimeOffset.UtcNow;
        RejectionReason = Required(reason, nameof(reason));
        Touch();
    }

    public void Disburse()
    {
        EnsureTransition(to: AdvanceStatus.Disbursed, AdvanceStatus.Approved);
        Status = AdvanceStatus.Disbursed;
        Touch();
    }

    public void MarkClientPaymentDetected()
    {
        EnsureFinancingModel(FinancingModel.InvoiceDiscounting);
        EnsureTransition(to: AdvanceStatus.ClientPaymentDetected, AdvanceStatus.Disbursed);

        Status = AdvanceStatus.ClientPaymentDetected;
        Touch();
    }

    public void MarkClientPaidHassil()
    {
        EnsureFinancingModel(FinancingModel.InvoiceFactoring);
        EnsureTransition(to: AdvanceStatus.ClientPaidHassil, AdvanceStatus.Disbursed);

        Status = AdvanceStatus.ClientPaidHassil;
        Touch();
    }

    public void ReleaseBuffer()
    {
        EnsureFinancingModel(FinancingModel.InvoiceFactoring);
        EnsureTransition(to: AdvanceStatus.BufferReleased, AdvanceStatus.ClientPaidHassil);

        Status = AdvanceStatus.BufferReleased;
        Touch();
    }

    public void MarkRepaid()
    {
        var allowedFrom = FinancingModel == FinancingModel.InvoiceFactoring
            ? new[] { AdvanceStatus.BufferReleased }
            : new[] { AdvanceStatus.ClientPaymentDetected };

        EnsureTransition(to: AdvanceStatus.Repaid, allowedFrom);
        Status = AdvanceStatus.Repaid;
        Touch();
    }

    public void MarkDefaulted()
    {
        if (Status is AdvanceStatus.Repaid or AdvanceStatus.Rejected or AdvanceStatus.Defaulted)
            throw new InvalidOperationException($"Advance request '{Id}' cannot be defaulted from status '{Status}'.");

        Status = AdvanceStatus.Defaulted;
        Touch();
    }

    public void UpdateReviewScore(int reviewScore)
    {
        ReviewScore = NormalizeReviewScore(reviewScore);
        Touch();
    }

    public void AddTransaction(Transaction transaction) => Transactions.Add(transaction);

    public void AddAiReviewSnapshot(AiReviewSnapshot snapshot) => AiReviewSnapshots.Add(snapshot);

    public void AddAdminReview(AdminReview adminReview) => AdminReviews.Add(adminReview);

    // Helpers
    private void Approve(ApprovalModeEnum approvalMode, Guid? reviewedBy)
    {
        EnsureTransition(to: AdvanceStatus.Approved, AdvanceStatus.PendingReview);

        Status = AdvanceStatus.Approved;
        ApprovalMode = approvalMode;
        ReviewedBy = reviewedBy;
        ReviewedAt = DateTimeOffset.UtcNow;
        RejectionReason = null;
        Touch();
    }

    private void EnsureTransition(AdvanceStatus to, params AdvanceStatus[] allowedFrom)
    {
        if (!allowedFrom.Contains(Status))
            throw new InvalidOperationException(
                $"Invalid advance transition: '{Status}' to '{to}'. Expected current status: {string.Join(", ", allowedFrom)}.");
    }

    private void EnsureFinancingModel(FinancingModel expected)
    {
        if (FinancingModel != expected)
            throw new InvalidOperationException(
                $"Advance request '{Id}' uses '{FinancingModel}' and cannot perform a '{expected}' transition.");
    }

    private static void ValidatePercent(decimal value, string parameterName)
    {
        if (value <= 0 || value > 1)
            throw new ArgumentOutOfRangeException(parameterName, "Percent values must be greater than 0 and less than or equal to 1.");
    }

    private static void ValidateRate(decimal value, string parameterName)
    {
        if (value < 0 || value > 1)
            throw new ArgumentOutOfRangeException(parameterName, "Rate values must be between 0 and 1.");
    }

    private static void ValidateMoney(decimal value, string parameterName, bool allowZero = false)
    {
        if (allowZero ? value < 0 : value <= 0)
            throw new ArgumentOutOfRangeException(parameterName, allowZero
                ? "Money values cannot be negative."
                : "Money values must be greater than zero.");
    }

    private static int NormalizeReviewScore(int score) => Math.Clamp(score, 0, 100);

    private static string Required(string value, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException($"{parameterName} is required.", parameterName);

        return value.Trim();
    }

    private void Touch() => UpdatedAt = DateTimeOffset.UtcNow;
}
