using Hassil.Api.Database;
using Hassil.Api.Domain.Enums;
using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.Ledger;

public class LedgerService(HassilDbContext dbContext) : ILedgerService
{
    public Transaction Record(
        Guid userId,
        TransactionType type,
        TransactionDirection direction,
        decimal amount,
        Guid? invoiceId = null,
        Guid? advanceRequestId = null,
        string? description = null)
    {
        var transaction = Transaction.Create(
            userId:           userId,
            type:             type,
            direction:        direction,
            amount:           amount,
            invoiceId:        invoiceId,
            advanceRequestId: advanceRequestId,
            description:      description);

        dbContext.Transactions.Add(transaction);
        return transaction;
    }
}
