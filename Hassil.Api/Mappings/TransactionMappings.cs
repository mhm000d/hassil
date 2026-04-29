using Hassil.Api.Contracts.Transactions;
using Hassil.Api.Domain.Models;

namespace Hassil.Api.Mappings;

public static class TransactionMappings
{
    public static TransactionResponse ToResponse(this Transaction transaction) => new(
        Id:               transaction.Id,
        InvoiceId:        transaction.InvoiceId,
        InvoiceNumber:    transaction.Invoice?.InvoiceNumber,
        AdvanceRequestId: transaction.AdvanceRequestId,
        Type:             transaction.Type.ToString(),
        Direction:        transaction.Direction.ToString(),
        Amount:           transaction.Amount,
        Description:      transaction.Description,
        CreatedAt:        transaction.CreatedAt);
}
