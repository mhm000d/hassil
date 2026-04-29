using Hassil.Api.Contracts.Invoices;
using Hassil.Api.Database;
using Hassil.Api.Domain.Enums;
using Hassil.Api.Domain.Models;
using Hassil.Api.Exceptions;
using Microsoft.EntityFrameworkCore;
using ValidationException = Hassil.Api.Exceptions.ValidationException;

namespace Hassil.Api.Services.Invoices;

public class InvoiceService(
    HassilDbContext dbContext,
    IInvoiceFingerprintService fingerprintService,
    ILogger<InvoiceService> logger) : IInvoiceService
{
    public async Task<Invoice> CreateAsync(
        Guid userId,
        CreateInvoiceRequest request,
        ReceivableSource receivableSource,
        CancellationToken ct = default)
    {
        EnsureRequired(request.ClientName, "Client name is required.", "CLIENT_NAME_REQUIRED");
        EnsureRequired(request.ClientEmail, "Client email is required.", "CLIENT_EMAIL_REQUIRED");
        EnsureRequired(request.InvoiceNumber, "Invoice number is required.", "INVOICE_NUMBER_REQUIRED");
        EnsureRequired(request.Currency, "Currency is required.", "CURRENCY_REQUIRED");

        if (request.Amount <= 0)
            throw new ValidationException(
                "Invoice amount must be greater than zero.",
                "INVALID_INVOICE_AMOUNT");

        if (request.DueDate < request.IssueDate)
            throw new ValidationException(
                "Due date cannot be before issue date.",
                "INVALID_DUE_DATE");

        var client = await GetOrCreateClientAsync(
            request.ClientName,
            request.ClientEmail,
            request.ClientCountry,
            ct);

        var fingerprint = fingerprintService.Create(
            request.InvoiceNumber,
            request.ClientEmail,
            request.Amount,
            request.DueDate,
            receivableSource);

        var duplicateExists = await dbContext.Invoices
            .AnyAsync(i => i.InvoiceFingerprint == fingerprint, ct);

        if (duplicateExists)
            throw new ConflictException(
                "An invoice with the same number, client, amount, due date, and source already exists.",
                "DUPLICATE_INVOICE");

        var invoice = Invoice.Create(
            userId:             userId,
            clientId:           client.Id,
            invoiceNumber:      request.InvoiceNumber,
            amount:             request.Amount,
            issueDate:          request.IssueDate,
            dueDate:            request.DueDate,
            invoiceFingerprint: fingerprint,
            receivableSource:   receivableSource,
            currency:           request.Currency,
            description:        request.Description,
            paymentTerms:       request.PaymentTerms);

        dbContext.Invoices.Add(invoice);
        await dbContext.SaveChangesAsync(ct);

        logger.LogInformation(
            "Invoice created. InvoiceId={InvoiceId} UserId={UserId} InvoiceNumber={InvoiceNumber}",
            invoice.Id,
            userId,
            invoice.InvoiceNumber);

        await LoadInvoiceGraphAsync(invoice, ct);
        return invoice;
    }

    public async Task<IReadOnlyList<Invoice>> GetInvoicesAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        return await dbContext.Invoices
            .Where(i => i.UserId == userId)
            .Include(i => i.Client)
            .Include(i => i.Documents)
            .Include(i => i.AdvanceRequest)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<Invoice> GetInvoiceAsync(
        Guid userId,
        Guid invoiceId,
        CancellationToken ct = default)
    {
        return await InvoiceQuery(userId)
                   .FirstOrDefaultAsync(i => i.Id == invoiceId, ct)
               ?? throw new NotFoundException("Invoice not found.", "INVOICE_NOT_FOUND");
    }

    public async Task<InvoiceDocument> AddDocumentAsync(
        Guid userId,
        Guid invoiceId,
        AddInvoiceDocumentRequest request,
        CancellationToken ct = default)
    {
        EnsureRequired(request.FileName, "File name is required.", "FILE_NAME_REQUIRED");
        EnsureRequired(request.DocumentType, "Document type is required.", "DOCUMENT_TYPE_REQUIRED");

        var invoice = await GetInvoiceAsync(userId, invoiceId, ct);

        if (invoice.Status is InvoiceStatus.Cancelled or InvoiceStatus.Paid)
            throw new ConflictException(
                $"Invoice '{invoice.InvoiceNumber}' cannot accept documents from status '{invoice.Status}'.",
                "INVALID_INVOICE_STATUS");

        var fileUrl = string.IsNullOrWhiteSpace(request.FileUrl)
            ? $"/demo-documents/{Uri.EscapeDataString(request.FileName.Trim())}"
            : request.FileUrl.Trim();

        var document = InvoiceDocument.Create(
            invoiceId:     invoice.Id,
            fileName:      request.FileName,
            fileUrl:       fileUrl,
            documentType:  request.DocumentType);

        invoice.AddDocument(document);
        await dbContext.SaveChangesAsync(ct);

        logger.LogInformation(
            "Invoice document added. InvoiceId={InvoiceId} DocumentId={DocumentId}",
            invoice.Id,
            document.Id);

        return document;
    }

    public async Task<Invoice> SubmitAsync(
        Guid userId,
        Guid invoiceId,
        CancellationToken ct = default)
    {
        var invoice = await GetInvoiceAsync(userId, invoiceId, ct);

        try
        {
            invoice.Submit();
        }
        catch (InvalidOperationException ex)
        {
            throw new ConflictException(ex.Message, "INVALID_INVOICE_TRANSITION");
        }

        await dbContext.SaveChangesAsync(ct);

        logger.LogInformation(
            "Invoice submitted. InvoiceId={InvoiceId} UserId={UserId}",
            invoice.Id,
            userId);

        return invoice;
    }

    private IQueryable<Invoice> InvoiceQuery(Guid userId) =>
        dbContext.Invoices
            .Where(i => i.UserId == userId)
            .Include(i => i.Client)
            .Include(i => i.Documents)
            .Include(i => i.AdvanceRequest);

    private async Task<Client> GetOrCreateClientAsync(
        string name,
        string email,
        string? country,
        CancellationToken ct)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();

        var client = await dbContext.Clients
            .FirstOrDefaultAsync(c => c.Email == normalizedEmail, ct);

        if (client is not null)
            return client;

        client = Client.Create(name, normalizedEmail, country);
        dbContext.Clients.Add(client);

        return client;
    }

    private async Task LoadInvoiceGraphAsync(Invoice invoice, CancellationToken ct)
    {
        if (!dbContext.Entry(invoice).Reference(i => i.Client).IsLoaded)
            await dbContext.Entry(invoice).Reference(i => i.Client).LoadAsync(ct);

        if (!dbContext.Entry(invoice).Collection(i => i.Documents).IsLoaded)
            await dbContext.Entry(invoice).Collection(i => i.Documents).LoadAsync(ct);

        if (!dbContext.Entry(invoice).Reference(i => i.AdvanceRequest).IsLoaded)
            await dbContext.Entry(invoice).Reference(i => i.AdvanceRequest).LoadAsync(ct);
    }

    private static void EnsureRequired(string? value, string message, string code)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ValidationException(message, code);
    }
}
