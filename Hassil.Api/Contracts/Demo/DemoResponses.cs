namespace Hassil.Api.Contracts.Demo;

public record DemoSeedResponse(
    int UsersCreated,
    int ClientsCreated,
    int InvoicesCreated,
    int AdvanceRequestsCreated,
    int TransactionsCreated,
    int TrustScoreEventsCreated,
    int AiReviewSnapshotsCreated,
    List<DemoIdentityResponse> Identities);

public record DemoIdentityResponse(
    string Persona,
    string DisplayName,
    string Email,
    string Role,
    string AccountType);
