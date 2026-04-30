using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.Transactions;

public interface ITransactionService
{
    Task<IEnumerable<Transaction>> GetTransactionsAsync(Guid userId, CancellationToken ct = default);
}
