using Hassil.Api.Contracts.Invoices;
using Hassil.Api.Domain.Models;

namespace Hassil.Api.Mappings;

public static class InvoiceMappings
{
    public static InvoiceSummaryResponse ToSummaryResponse(this Invoice invoice) => new(
        Id:               invoice.Id,
        InvoiceNumber:    invoice.InvoiceNumber,
        Client:           invoice.Client.ToResponse(),
        ReceivableSource: invoice.ReceivableSource.ToString(),
        Amount:           invoice.Amount,
        Currency:         invoice.Currency,
        DueDate:          invoice.DueDate,
        Status:           invoice.Status.ToString(),
        DocumentCount:    invoice.Documents.Count,
        AdvanceRequestId: invoice.AdvanceRequest?.Id,
        CreatedAt:        invoice.CreatedAt);

    public static InvoiceResponse ToResponse(this Invoice invoice) => new(
        Id:                 invoice.Id,
        UserId:             invoice.UserId,
        Client:             invoice.Client.ToResponse(),
        InvoiceNumber:      invoice.InvoiceNumber,
        ReceivableSource:   invoice.ReceivableSource.ToString(),
        Amount:             invoice.Amount,
        Currency:           invoice.Currency,
        IssueDate:          invoice.IssueDate,
        DueDate:            invoice.DueDate,
        Description:        invoice.Description,
        PaymentTerms:       invoice.PaymentTerms,
        Status:             invoice.Status.ToString(),
        InvoiceFingerprint: invoice.InvoiceFingerprint,
        Documents:          invoice.Documents.Select(d => d.ToResponse()).ToList(),
        AdvanceRequestId:   invoice.AdvanceRequest?.Id,
        CreatedAt:          invoice.CreatedAt,
        UpdatedAt:          invoice.UpdatedAt);

    public static ClientResponse ToResponse(this Client client) => new(
        Id:      client.Id,
        Name:    client.Name,
        Email:   client.Email,
        Country: client.Country);

    public static InvoiceDocumentResponse ToResponse(this InvoiceDocument document) => new(
        Id:           document.Id,
        FileName:     document.FileName,
        FileUrl:      document.FileUrl,
        DocumentType: document.DocumentType,
        UploadedAt:   document.UploadedAt);
}
