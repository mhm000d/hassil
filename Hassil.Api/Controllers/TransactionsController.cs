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
    public async Task<IActionResult> GetTransactions(CancellationToken ct)
    {
        var transactions = await transactionService.GetTransactionsAsync(GetUserId(), ct);
        return Ok(transactions.ToResponse());
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
