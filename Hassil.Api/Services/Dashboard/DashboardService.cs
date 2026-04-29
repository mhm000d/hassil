using Hassil.Api.Database;
using Hassil.Api.Domain.Enums;
using Hassil.Api.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Hassil.Api.Services.Dashboard;

public class DashboardService(HassilDbContext dbContext) : IDashboardService
{
    private static readonly InvoiceStatus[] OutstandingInvoiceStatuses =
    [
        InvoiceStatus.Draft,
        InvoiceStatus.Submitted,
        InvoiceStatus.AdvanceRequested,
        InvoiceStatus.PendingClientConfirmation,
        InvoiceStatus.Confirmed,
        InvoiceStatus.PendingReview,
        InvoiceStatus.Approved,
        InvoiceStatus.Disbursed
    ];

    private static readonly AdvanceStatus[] ActiveAdvanceStatuses =
    [
        AdvanceStatus.PendingClientConfirmation,
        AdvanceStatus.PendingReview,
        AdvanceStatus.Approved,
        AdvanceStatus.Disbursed,
        AdvanceStatus.ClientPaymentDetected,
        AdvanceStatus.ClientPaidHassil,
        AdvanceStatus.BufferReleased
    ];

    public async Task<DashboardSummary> GetSummaryAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var user = await dbContext.Users
                       .AsNoTracking()
                       .FirstOrDefaultAsync(u => u.Id == userId, ct)
                   ?? throw new NotFoundException("User not found.", "USER_NOT_FOUND");

        var outstandingInvoices = dbContext.Invoices
            .AsNoTracking()
            .Where(i =>
                i.UserId == userId
                && OutstandingInvoiceStatuses.Contains(i.Status));

        var activeAdvances = dbContext.AdvanceRequests
            .AsNoTracking()
            .Where(a =>
                a.UserId == userId
                && ActiveAdvanceStatuses.Contains(a.Status));

        var transactions = dbContext.Transactions
            .AsNoTracking()
            .Where(t => t.UserId == userId);

        var outstandingInvoiceMetric = new DashboardMoneyMetric(
            Count:  await outstandingInvoices.CountAsync(ct),
            Amount: await outstandingInvoices.SumAsync(i => (decimal?)i.Amount, ct) ?? 0m);

        var activeAdvanceMetric = new DashboardMoneyMetric(
            Count:  await activeAdvances.CountAsync(ct),
            Amount: await activeAdvances.SumAsync(a => (decimal?)a.AdvanceAmount, ct) ?? 0m);

        var expectedRepaymentMetric = new DashboardMoneyMetric(
            Count:  await activeAdvances.CountAsync(ct),
            Amount: await activeAdvances.SumAsync(a => (decimal?)a.ExpectedRepaymentAmount, ct) ?? 0m);

        var ledgerCredits = await transactions
            .Where(t => t.Direction == TransactionDirection.Credit)
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;

        var ledgerDebits = await transactions
            .Where(t => t.Direction == TransactionDirection.Debit)
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;

        var reviewStates = new DashboardReviewState(
            PendingClientConfirmation: await activeAdvances
                .CountAsync(a => a.Status == AdvanceStatus.PendingClientConfirmation, ct),
            PendingReview: await activeAdvances
                .CountAsync(a => a.Status == AdvanceStatus.PendingReview, ct),
            ApprovedReadyForDisbursement: await activeAdvances
                .CountAsync(a => a.Status == AdvanceStatus.Approved, ct));

        var recentTransactions = await transactions
            .Include(t => t.Invoice)
            .OrderByDescending(t => t.CreatedAt)
            .Take(5)
            .ToListAsync(ct);

        return new DashboardSummary(
            AccountType:         user.AccountType.ToString(),
            FinancingModel:      GetFinancingModel(user.AccountType),
            TrustScore:          user.TrustScore,
            LedgerBalance:       ledgerCredits - ledgerDebits,
            OutstandingInvoices: outstandingInvoiceMetric,
            ActiveAdvances:      activeAdvanceMetric,
            ExpectedRepayments:  expectedRepaymentMetric,
            ReviewStates:        reviewStates,
            RecentTransactions:  recentTransactions);
    }

    private static string GetFinancingModel(AccountType accountType) =>
        accountType == AccountType.Freelancer
            ? FinancingModel.InvoiceDiscounting.ToString()
            : FinancingModel.InvoiceFactoring.ToString();
}
