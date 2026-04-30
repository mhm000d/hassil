using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.Notifications;

public interface IMockNotificationService
{
    ClientConfirmation CreateClientConfirmation(Invoice invoice);
}
