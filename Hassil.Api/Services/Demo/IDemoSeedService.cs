namespace Hassil.Api.Services.Demo;

public interface IDemoSeedService
{
    Task<DemoSeedResult> SeedAsync(CancellationToken ct = default);
}

public record DemoSeedResult(
    int UsersCreated,
    int ClientsCreated,
    int InvoicesCreated,
    int AdvanceRequestsCreated,
    int TransactionsCreated,
    int TrustScoreEventsCreated,
    int AiReviewSnapshotsCreated,
    IReadOnlyList<DemoIdentity> Identities);

public record DemoIdentity(
    string Persona,
    string DisplayName,
    string Email,
    string Role,
    string AccountType);
