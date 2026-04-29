using System.Security.Claims;
using Hassil.Api.Contracts.Invoices;
using Hassil.Api.Domain.Enums;
using Hassil.Api.Mappings;
using Hassil.Api.Services.Invoices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ValidationException = Hassil.Api.Exceptions.ValidationException;

namespace Hassil.Api.Controllers;

[ApiController]
[Authorize]
public class InvoicesController(IInvoiceService invoiceService) : ControllerBase
{
    [HttpPost(ApiEndpoints.Invoices.Create)]
    public async Task<IActionResult> Create(
        [FromBody] CreateInvoiceRequest request,
        CancellationToken ct)
    {
        if (!Enum.TryParse<ReceivableSource>(
                request.ReceivableSource,
                ignoreCase: true,
                out var receivableSource))
        {
            throw new ValidationException(
                $"'{request.ReceivableSource}' is not a valid receivable source.",
                "INVALID_RECEIVABLE_SOURCE");
        }

        var invoice = await invoiceService.CreateAsync(
            GetUserId(),
            request,
            receivableSource,
            ct);

        return CreatedAtAction(nameof(Get), new { id = invoice.Id }, invoice.ToResponse());
    }

    [HttpGet(ApiEndpoints.Invoices.GetAll)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var invoices = await invoiceService.GetInvoicesAsync(GetUserId(), ct);
        return Ok(invoices.Select(i => i.ToSummaryResponse()).ToList());
    }

    [HttpGet(ApiEndpoints.Invoices.Get)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var invoice = await invoiceService.GetInvoiceAsync(GetUserId(), id, ct);
        return Ok(invoice.ToResponse());
    }

    [HttpPost(ApiEndpoints.Invoices.AddDocument)]
    public async Task<IActionResult> AddDocument(
        Guid id,
        [FromBody] AddInvoiceDocumentRequest request,
        CancellationToken ct)
    {
        var document = await invoiceService.AddDocumentAsync(GetUserId(), id, request, ct);
        return Ok(document.ToResponse());
    }

    [HttpPost(ApiEndpoints.Invoices.Submit)]
    public async Task<IActionResult> Submit(Guid id, CancellationToken ct)
    {
        var invoice = await invoiceService.SubmitAsync(GetUserId(), id, ct);
        return Ok(invoice.ToResponse());
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
