using Hassil.Api.Domain.Enums;

namespace Hassil.Api.Domain.Models;

public class User
{
    public Guid Id { get; private set; }
    public AccountType AccountType { get; private set; }
    public UserRole Role { get; private set; }
    public string Email { get; private set; } = null!;
    public string? Phone { get; private set; }
    public string? Country { get; private set; }
    public string? PasswordHash { get; private set; }
    public int TrustScore { get; private set; }
    public UserStatus Status { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    // Navigation Properties
    public SmallBusinessProfile? SmallBusinessProfile { get; private set; }
    public FreelancerProfile? FreelancerProfile { get; private set; }
    public ICollection<Invoice> Invoices { get; private set; } = [];
    public ICollection<AdvanceRequest> AdvanceRequests { get; private set; } = [];
    public ICollection<Transaction> Transactions { get; private set; } = [];
    public ICollection<TrustScoreEvent> TrustScoreEvents { get; private set; } = [];
    public ICollection<AdminReview> AdminReviews { get; private set; } = [];

    // Factory
    public static User Create(
        AccountType accountType,
        string email,
        string? phone = null,
        string? country = null,
        string? passwordHash = null)
    {
        var now = DateTimeOffset.UtcNow;

        return new User
        {
            Id = Guid.NewGuid(),
            AccountType = accountType,
            Role = UserRole.User,
            Email = Required(email, nameof(email)),
            Phone = Optional(phone),
            Country = Optional(country),
            PasswordHash = Optional(passwordHash),
            TrustScore = 40,
            Status = UserStatus.Active,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    public static User CreateSmallBusiness(
        string email,
        string businessName,
        string registrationNumber,
        string? phone = null,
        string? country = null,
        string? passwordHash = null)
    {
        var user = Create(AccountType.SmallBusiness, email, phone, country, passwordHash);
        user.SmallBusinessProfile = SmallBusinessProfile.Create(user.Id, businessName, registrationNumber);

        return user;
    }

    public static User CreateFreelancer(
        string email,
        string fullName,
        string? phone = null,
        string? country = null,
        string? passwordHash = null)
    {
        var user = Create(AccountType.Freelancer, email, phone, country, passwordHash);
        user.FreelancerProfile = FreelancerProfile.Create(user.Id, fullName);

        return user;
    }

    // State Machine
    public void Suspend()
    {
        EnsureTransition(from: UserStatus.Active, to: UserStatus.Suspended);
        Status = UserStatus.Suspended;
        Touch();
    }

    public void Activate()
    {
        EnsureTransition(from: UserStatus.Suspended, to: UserStatus.Active);
        Status = UserStatus.Active;
        Touch();
    }

    public void PromoteToAdmin()
    {
        Role = UserRole.Admin;
        Touch();
    }

    public void MarkAsUser()
    {
        Role = UserRole.User;
        Touch();
    }

    public void UpdateContact(string email, string? phone = null, string? country = null)
    {
        Email = Required(email, nameof(email));
        Phone = Optional(phone);
        Country = Optional(country);
        Touch();
    }

    public void SetPasswordHash(string passwordHash)
    {
        PasswordHash = Required(passwordHash, nameof(passwordHash));
        Touch();
    }

    public TrustScoreEvent SetTrustScore(int newScore, string reason)
    {
        var oldScore = TrustScore;
        TrustScore = NormalizeTrustScore(newScore);
        Touch();

        var trustScoreEvent = TrustScoreEvent.Create(Id, oldScore, TrustScore, reason);
        TrustScoreEvents.Add(trustScoreEvent);

        return trustScoreEvent;
    }

    public TrustScoreEvent AdjustTrustScore(int delta, string reason)
    {
        return SetTrustScore(TrustScore + delta, reason);
    }

    public void AttachSmallBusinessProfile(SmallBusinessProfile profile)
    {
        if (AccountType != AccountType.SmallBusiness)
            throw new InvalidOperationException("Only small business users can have a small business profile.");

        SmallBusinessProfile = profile;
        Touch();
    }

    public void AttachFreelancerProfile(FreelancerProfile profile)
    {
        if (AccountType != AccountType.Freelancer)
            throw new InvalidOperationException("Only freelancer users can have a freelancer profile.");

        FreelancerProfile = profile;
        Touch();
    }

    public void AddInvoice(Invoice invoice) => Invoices.Add(invoice);

    public void AddAdvanceRequest(AdvanceRequest advanceRequest) => AdvanceRequests.Add(advanceRequest);

    public void AddTransaction(Transaction transaction) => Transactions.Add(transaction);

    public void AddAdminReview(AdminReview adminReview) => AdminReviews.Add(adminReview);

    // Helpers
    private void EnsureTransition(UserStatus from, UserStatus to)
    {
        if (Status != from)
            throw new InvalidOperationException(
                $"Invalid user transition: '{Status}' to '{to}'. Expected current status: '{from}'.");
    }

    private static int NormalizeTrustScore(int score) => Math.Clamp(score, 0, 100);

    private static string Required(string value, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException($"{parameterName} is required.", parameterName);

        return value.Trim();
    }

    private static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private void Touch() => UpdatedAt = DateTimeOffset.UtcNow;
}
