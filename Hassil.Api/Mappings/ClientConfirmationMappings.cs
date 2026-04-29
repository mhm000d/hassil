using Hassil.Api.Contracts.ClientConfirmations;
using Hassil.Api.Domain.Models;

namespace Hassil.Api.Mappings;

public static class ClientConfirmationMappings
{
    public static ClientConfirmationResponse ToResponse(this ClientConfirmation confirmation) => new(
        Id:             confirmation.Id,
        Token:          confirmation.Token,
        ClientEmail:    confirmation.ClientEmail,
        Status:         confirmation.Status.ToString(),
        ClientNote:     confirmation.ClientNote,
        RespondedAt:    confirmation.RespondedAt,
        ExpiresAt:      confirmation.ExpiresAt,
        Invoice:        confirmation.Invoice.ToSummaryResponse(),
        AdvanceRequest: confirmation.Invoice.AdvanceRequest?.ToSummaryResponse());
}
