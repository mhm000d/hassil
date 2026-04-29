using Hassil.Api.Domain.Enums;
using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.Ledger;

public interface ILedgerService
{
    Transaction Record(
        Guid userId,
        TransactionType type,
        TransactionDirection direction,
        decimal amount,
        Guid? invoiceId = null,
        Guid? advanceRequestId = null,
        string? description = null);
}
