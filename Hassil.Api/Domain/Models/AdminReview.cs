using Hassil.Api.Domain.Enums;

namespace Hassil.Api.Domain.Models;

public class AdminReview
{
    public Guid Id { get; private set; }
    public Guid AdvanceRequestId { get; private set; }
    public Guid ReviewerUserId { get; private set; }
    public AdminDecision Decision { get; private set; }
    public string? Notes { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    // Navigation Properties
    public AdvanceRequest AdvanceRequest { get; private set; } = null!;
    public User ReviewerUser { get; private set; } = null!;

    // Factory
    public static AdminReview Create(
        Guid advanceRequestId,
        Guid reviewerUserId,
        AdminDecision decision,
        string? notes = null)
    {
        return new AdminReview
        {
            Id = Guid.NewGuid(),
            AdvanceRequestId = advanceRequestId,
            ReviewerUserId = reviewerUserId,
            Decision = decision,
            Notes = Optional(notes),
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void UpdateNotes(string? notes)
    {
        Notes = Optional(notes);
    }

    // Helpers
    private static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
