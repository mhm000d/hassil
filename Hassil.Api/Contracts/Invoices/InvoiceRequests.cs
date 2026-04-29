namespace Hassil.Api.Contracts.Invoices;

// ReceivableSource accepted values:
// "DirectClientInvoice" | "FreelancePlatformPayout"
// Parsed/validated in the controller before hitting the service.
public record CreateInvoiceRequest(
    string ClientName,
    string ClientEmail,
    string? ClientCountry,
    string InvoiceNumber,
    string ReceivableSource,
    decimal Amount,
    string Currency,
    DateOnly IssueDate,
    DateOnly DueDate,
    string? Description,
    string? PaymentTerms);

public record AddInvoiceDocumentRequest(
    string FileName,
    string? FileUrl,
    string DocumentType);
