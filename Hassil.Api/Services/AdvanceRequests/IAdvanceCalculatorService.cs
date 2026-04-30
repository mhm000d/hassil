using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.AdvanceRequests;

public interface IAdvanceCalculatorService
{
    AdvanceQuote Calculate(User user, Invoice invoice, decimal? requestedPercent);
}
