namespace Hassil.Api.Contracts.Invoices;

public record InvoiceResponse(
    Guid Id,
    Guid UserId,
    ClientResponse Client,
    string InvoiceNumber,
    string ReceivableSource,
    decimal Amount,
    string Currency,
    DateOnly IssueDate,
    DateOnly DueDate,
    string? Description,
    string? PaymentTerms,
    string Status,
    string InvoiceFingerprint,
    List<InvoiceDocumentResponse> Documents,
    Guid? AdvanceRequestId,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public record InvoiceSummaryResponse(
    Guid Id,
    string InvoiceNumber,
    ClientResponse Client,
    string ReceivableSource,
    decimal Amount,
    string Currency,
    DateOnly DueDate,
    string Status,
    int DocumentCount,
    Guid? AdvanceRequestId,
    DateTimeOffset CreatedAt);

public record ClientResponse(
    Guid Id,
    string Name,
    string Email,
    string? Country);

public record InvoiceDocumentResponse(
    Guid Id,
    string FileName,
    string FileUrl,
    string DocumentType,
    DateTimeOffset UploadedAt);
