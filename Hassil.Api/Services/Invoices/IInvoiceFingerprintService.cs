using Hassil.Api.Domain.Enums;

namespace Hassil.Api.Services.Invoices;

public interface IInvoiceFingerprintService
{
    string Create(
        string invoiceNumber,
        string clientEmail,
        decimal amount,
        DateOnly dueDate,
        ReceivableSource receivableSource);
}
