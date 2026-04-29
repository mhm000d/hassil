using Hassil.Api.Contracts.Demo;
using Hassil.Api.Services.Demo;

namespace Hassil.Api.Mappings;

public static class DemoMappings
{
    public static DemoSeedResponse ToResponse(this DemoSeedResult result) => new(
        UsersCreated:             result.UsersCreated,
        ClientsCreated:           result.ClientsCreated,
        InvoicesCreated:          result.InvoicesCreated,
        AdvanceRequestsCreated:   result.AdvanceRequestsCreated,
        TransactionsCreated:      result.TransactionsCreated,
        TrustScoreEventsCreated:  result.TrustScoreEventsCreated,
        AiReviewSnapshotsCreated: result.AiReviewSnapshotsCreated,
        Identities:               result.Identities.Select(i => i.ToResponse()).ToList());

    public static DemoIdentityResponse ToResponse(this DemoIdentity identity) => new(
        Persona:     identity.Persona,
        DisplayName: identity.DisplayName,
        Email:       identity.Email,
        Role:        identity.Role,
        AccountType: identity.AccountType);
}
