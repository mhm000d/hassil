using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Hassil.Api.Domain.Enums;

namespace Hassil.Api.Services.Invoices;

public class InvoiceFingerprintService : IInvoiceFingerprintService
{
    public string Create(
        string invoiceNumber,
        string clientEmail,
        decimal amount,
        DateOnly dueDate,
        ReceivableSource receivableSource)
    {
        var raw = string.Join(
            '|',
            invoiceNumber.Trim().ToLowerInvariant(),
            clientEmail.Trim().ToLowerInvariant(),
            amount.ToString("0.00", CultureInfo.InvariantCulture),
            dueDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            receivableSource.ToString());

        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)))
            .ToLowerInvariant();
    }
}
