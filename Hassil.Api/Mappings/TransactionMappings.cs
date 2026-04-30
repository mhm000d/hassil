using Hassil.Api.Contracts.Transactions;
using Hassil.Api.Domain.Models;

namespace Hassil.Api.Mappings;

public static class TransactionMappings
{
    public static TransactionResponse ToResponse(this Transaction transaction)
    {
        return new TransactionResponse(
            Id: transaction.Id,
            Type: transaction.Type.ToString(),
            Direction: transaction.Direction.ToString(),
            Amount: transaction.Amount,
            Description: transaction.Description,
            CreatedAt: transaction.CreatedAt);
    }

    public static IEnumerable<TransactionResponse> ToResponse(this IEnumerable<Transaction> transactions)
    {
        return transactions.Select(t => t.ToResponse());
    }
}
