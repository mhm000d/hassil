using Hassil.Api.Contracts.Dashboard;
using Hassil.Api.Database;
using Hassil.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Hassil.Api.Services.Dashboard;

public class DashboardService(HassilDbContext dbContext) : IDashboardService
{
    public async Task<DashboardSummaryResponse> GetSummaryAsync(Guid userId, CancellationToken ct = default)
    {
        var trustScore = await dbContext.Users
            .Where(u => u.Id == userId)
            .Select(u => u.TrustScore)
            .FirstOrDefaultAsync(ct);

        var transactions = await dbContext.Transactions
            .Where(t => t.UserId == userId)
            .ToListAsync(ct);

        var totalBalance = transactions
            .Where(t => t.Direction == TransactionDirection.Credit)
            .Sum(t => t.Amount) - 
            transactions
            .Where(t => t.Direction == TransactionDirection.Debit)
            .Sum(t => t.Amount);

        var outstandingInvoices = await dbContext.Invoices
            .Where(i => i.UserId == userId &&
                        i.Status != InvoiceStatus.Draft &&
                        i.Status != InvoiceStatus.Paid &&
                        i.Status != InvoiceStatus.Cancelled &&
                        i.Status != InvoiceStatus.Rejected)
            .SumAsync(i => i.Amount, ct);

        var activeAdvances = await dbContext.AdvanceRequests
            .Where(a => a.UserId == userId &&
                        a.Status != AdvanceStatus.PendingClientConfirmation &&
                        a.Status != AdvanceStatus.PendingReview &&
                        a.Status != AdvanceStatus.Approved &&
                        a.Status != AdvanceStatus.Rejected &&
                        a.Status != AdvanceStatus.Repaid &&
                        a.Status != AdvanceStatus.Defaulted)
            .SumAsync(a => a.AdvanceAmount, ct);

        return new DashboardSummaryResponse(
            TotalBalance: totalBalance,
            OutstandingInvoices: outstandingInvoices,
            ActiveAdvances: activeAdvances,
            TrustScore: trustScore
        );
    }
}
