using Hassil.Api.Contracts.Invoices;
using Hassil.Api.Domain.Enums;
using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.Invoices;

public interface IInvoiceService
{
    Task<Invoice> CreateAsync(
        Guid userId,
        CreateInvoiceRequest request,
        ReceivableSource receivableSource,
        CancellationToken ct = default);

    Task<IReadOnlyList<Invoice>> GetInvoicesAsync(Guid userId, CancellationToken ct = default);

    Task<Invoice> GetInvoiceAsync(Guid userId, Guid invoiceId, CancellationToken ct = default);

    Task<InvoiceDocument> AddDocumentAsync(
        Guid userId,
        Guid invoiceId,
        AddInvoiceDocumentRequest request,
        CancellationToken ct = default);

    Task<Invoice> SubmitAsync(Guid userId, Guid invoiceId, CancellationToken ct = default);
}
