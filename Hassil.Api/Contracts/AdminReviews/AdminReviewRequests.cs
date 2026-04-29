namespace Hassil.Api.Contracts.AdminReviews;

public record ApproveAdvanceRequestRequest(string? Notes);

public record RejectAdvanceRequestRequest(string Reason);

public record RequestMoreInfoRequest(string? Notes);
