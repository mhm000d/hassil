using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.Transactions;

public interface ITransactionService
{
    Task<IReadOnlyList<Transaction>> GetTransactionsAsync(
        Guid userId,
        int limit,
        CancellationToken ct = default);
}
