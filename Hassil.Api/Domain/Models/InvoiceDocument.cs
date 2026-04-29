namespace Hassil.Api.Domain.Models;

public class InvoiceDocument
{
    public Guid Id { get; private set; }
    public Guid InvoiceId { get; private set; }
    public string FileName { get; private set; } = null!;
    public string FileUrl { get; private set; } = null!;
    public string DocumentType { get; private set; } = null!;
    public DateTimeOffset UploadedAt { get; private set; }

    // Navigation Properties
    public Invoice Invoice { get; private set; } = null!;

    // Factory
    public static InvoiceDocument Create(
        Guid invoiceId,
        string fileName,
        string fileUrl,
        string documentType = "Other")
    {
        return new InvoiceDocument
        {
            Id = Guid.NewGuid(),
            InvoiceId = invoiceId,
            FileName = Required(fileName, nameof(fileName)),
            FileUrl = Required(fileUrl, nameof(fileUrl)),
            DocumentType = Required(documentType, nameof(documentType)),
            UploadedAt = DateTimeOffset.UtcNow
        };
    }

    public void Rename(string fileName)
    {
        FileName = Required(fileName, nameof(fileName));
    }

    public void ChangeDocumentType(string documentType)
    {
        DocumentType = Required(documentType, nameof(documentType));
    }

    // Helpers
    private static string Required(string value, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException($"{parameterName} is required.", parameterName);

        return value.Trim();
    }
}
