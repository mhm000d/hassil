using Hassil.Api.Contracts.AdvanceRequests;
using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.AdvanceRequests;

public interface IAdvanceRequestService
{
    Task<AdvanceQuote> QuoteAsync(
        Guid userId,
        AdvanceQuoteRequest request,
        CancellationToken ct = default);

    Task<AdvanceRequest> CreateAsync(
        Guid userId,
        CreateAdvanceRequest request,
        CancellationToken ct = default);

    Task<IReadOnlyList<AdvanceRequest>> GetAdvanceRequestsAsync(
        Guid userId,
        CancellationToken ct = default);

    Task<AdvanceRequest> GetAdvanceRequestAsync(
        Guid userId,
        Guid advanceRequestId,
        CancellationToken ct = default);
}
