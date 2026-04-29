using Hassil.Api.Contracts.AdvanceRequests;
using Hassil.Api.Contracts.Invoices;

namespace Hassil.Api.Contracts.ClientConfirmations;

public record ClientConfirmationResponse(
    Guid Id,
    string Token,
    string ClientEmail,
    string Status,
    string? ClientNote,
    DateTimeOffset? RespondedAt,
    DateTimeOffset ExpiresAt,
    InvoiceSummaryResponse Invoice,
    AdvanceRequestSummaryResponse? AdvanceRequest);
