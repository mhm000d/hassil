using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.ClientConfirmations;

public interface IClientConfirmationService
{
    Task<ClientConfirmation> GetAsync(string token, CancellationToken ct = default);

    Task<ClientConfirmation> ConfirmAsync(
        string token,
        string? note,
        CancellationToken ct = default);

    Task<ClientConfirmation> DisputeAsync(
        string token,
        string? note,
        CancellationToken ct = default);
}
