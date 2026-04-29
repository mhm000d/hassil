using System.Security.Claims;
using Hassil.Api.Mappings;
using Hassil.Api.Services.Transactions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hassil.Api.Controllers;

[ApiController]
[Authorize]
public class TransactionsController(ITransactionService transactionService) : ControllerBase
{
    [HttpGet(ApiEndpoints.Transactions.GetAll)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int limit = 100,
        CancellationToken ct = default)
    {
        limit = Math.Clamp(limit, 1, 500);

        var transactions = await transactionService.GetTransactionsAsync(GetUserId(), limit, ct);
        return Ok(transactions.Select(t => t.ToResponse()).ToList());
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
