using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.Notifications;

public class MockNotificationService : IMockNotificationService
{
    public ClientConfirmation CreateClientConfirmation(Invoice invoice)
    {
        var token = $"client-confirm-{Guid.NewGuid():N}";

        return ClientConfirmation.Create(
            invoiceId:   invoice.Id,
            token:       token,
            clientEmail: invoice.Client.Email,
            expiresAt:   DateTimeOffset.UtcNow.AddDays(7));
    }
}
