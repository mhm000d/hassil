using Hassil.Api.Database;
using Hassil.Api.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Hassil.Api.Services.Transactions;

public class TransactionService(HassilDbContext dbContext) : ITransactionService
{
    public async Task<IEnumerable<Transaction>> GetTransactionsAsync(Guid userId, CancellationToken ct = default)
    {
        return await dbContext.Transactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);
    }
}
