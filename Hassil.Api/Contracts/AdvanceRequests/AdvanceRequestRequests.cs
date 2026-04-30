namespace Hassil.Api.Contracts.AdvanceRequests;

public record AdvanceQuoteRequest(
    Guid InvoiceId,
    decimal? RequestedPercent);

public record CreateAdvanceRequest(
    Guid InvoiceId,
    decimal? RequestedPercent,
    bool TermsAccepted,
    string? TermsVersion);
