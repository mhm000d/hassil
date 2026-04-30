using Hassil.Api.Domain.Enums;
using Hassil.Api.Domain.Models;
using Hassil.Api.Exceptions;
using ValidationException = Hassil.Api.Exceptions.ValidationException;

namespace Hassil.Api.Services.AdvanceRequests;

public class AdvanceCalculatorService : IAdvanceCalculatorService
{
    public AdvanceQuote Calculate(User user, Invoice invoice, decimal? requestedPercent)
    {
        var tier = GetTier(user);
        var percent = requestedPercent ?? tier.MaxAdvancePercent;

        if (percent <= 0 || percent > tier.MaxAdvancePercent)
            throw new ValidationException(
                $"Requested percent must be greater than 0 and less than or equal to {tier.MaxAdvancePercent:P0}.",
                "INVALID_REQUESTED_PERCENT");

        var financingModel = user.AccountType == AccountType.Freelancer
            ? FinancingModel.InvoiceDiscounting
            : FinancingModel.InvoiceFactoring;

        var isFactoring = financingModel == FinancingModel.InvoiceFactoring;
        var advanceAmount = Round(invoice.Amount * percent);
        var feeAmount = Round(advanceAmount * tier.FeeRate);
        var settlementBufferAmount = isFactoring
            ? Round(invoice.Amount - advanceAmount - feeAmount)
            : 0m;

        var expectedRepaymentAmount = isFactoring
            ? invoice.Amount
            : Round(advanceAmount + feeAmount);

        var messages = new List<string>();
        if (advanceAmount > tier.MaxEligibleInvoiceAmount)
            messages.Add($"Requested advance exceeds the current funding limit of {tier.MaxEligibleInvoiceAmount:0.00} {invoice.Currency}.");

        if (invoice.DueDate < DateOnly.FromDateTime(DateTime.UtcNow))
            messages.Add("Invoice due date is in the past.");

        if (invoice.DueDate > DateOnly.FromDateTime(DateTime.UtcNow).AddDays(90))
            messages.Add("Invoice due date is more than 90 days away.");

        return new AdvanceQuote(
            InvoiceId:                     invoice.Id,
            FinancingModel:                financingModel,
            RepaymentParty:                isFactoring ? RepaymentParty.Client : RepaymentParty.User,
            PaymentDestination:            isFactoring ? PaymentDestination.HassilCollectionAccount : PaymentDestination.UserBankAccount,
            FeeCollectionTiming:           isFactoring ? FeeCollectionTiming.FromSettlementBuffer : FeeCollectionTiming.AtUserRepayment,
            ClientNotificationRequired:    isFactoring,
            ClientPaymentRedirectRequired: isFactoring,
            RequestedPercent:              percent,
            MaxAdvancePercent:             tier.MaxAdvancePercent,
            MaxEligibleInvoiceAmount:      tier.MaxEligibleInvoiceAmount,
            AdvanceAmount:                 advanceAmount,
            FeeRate:                       tier.FeeRate,
            FeeAmount:                     feeAmount,
            SettlementBufferAmount:        Math.Max(0m, settlementBufferAmount),
            ExpectedRepaymentAmount:       expectedRepaymentAmount,
            IsEligible:                    messages.Count == 0,
            EligibilityMessages:           messages);
    }

    private static AdvanceTier GetTier(User user)
    {
        return user.AccountType switch
        {
            AccountType.Freelancer when user.TrustScore < 50 => new(0.70m, 1_000m, 0.050m),
            AccountType.Freelancer when user.TrustScore < 80 => new(0.80m, 3_000m, 0.035m),
            AccountType.Freelancer => new(0.90m, 5_000m, 0.020m),
            AccountType.SmallBusiness when user.TrustScore < 50 => new(0.80m, 10_000m, 0.035m),
            AccountType.SmallBusiness when user.TrustScore < 80 => new(0.90m, 25_000m, 0.020m),
            AccountType.SmallBusiness => new(0.95m, 50_000m, 0.012m),
            _ => throw new ServerException("Unsupported account type.", "UNSUPPORTED_ACCOUNT_TYPE")
        };
    }

    private static decimal Round(decimal value) =>
        Math.Round(value, 2, MidpointRounding.AwayFromZero);

    private record AdvanceTier(
        decimal MaxAdvancePercent,
        decimal MaxEligibleInvoiceAmount,
        decimal FeeRate);
}
