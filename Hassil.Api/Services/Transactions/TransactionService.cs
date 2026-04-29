using Hassil.Api.Database;
using Hassil.Api.Domain.Models;
using Hassil.Api.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Hassil.Api.Services.Transactions;

public class TransactionService(HassilDbContext dbContext) : ITransactionService
{
    public async Task<IReadOnlyList<Transaction>> GetTransactionsAsync(
        Guid userId,
        int limit,
        CancellationToken ct = default)
    {
        var userExists = await dbContext.Users.AnyAsync(u => u.Id == userId, ct);
        if (!userExists)
            throw new NotFoundException("User not found.", "USER_NOT_FOUND");

        return await dbContext.Transactions
            .AsNoTracking()
            .Where(t => t.UserId == userId)
            .Include(t => t.Invoice)
            .OrderByDescending(t => t.CreatedAt)
            .Take(limit)
            .ToListAsync(ct);
    }
}
