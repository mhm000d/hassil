using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Hassil.Api.Database;
using Hassil.Api.Domain.Enums;
using Hassil.Api.Domain.Models;
using Hassil.Api.Services.Auth;
using Microsoft.EntityFrameworkCore;

namespace Hassil.Api.Services.Demo;

public class DemoSeedService(
    HassilDbContext dbContext,
    ILogger<DemoSeedService> logger) : IDemoSeedService
{
    private static readonly string[] DemoUserEmails =
    [
        DemoIdentityEmails.AhmedStudio,
        DemoIdentityEmails.SaraDesigns,
        DemoIdentityEmails.AdminReviewer
    ];

    private static readonly string[] DemoClientEmails =
    [
        "ap@omarhospitality.ae",
        "ap@nouraretail.sa",
        "payouts@nabdwork.com",
        "finance@lynxdigital.qa"
    ];

    private static readonly string[] DemoInvoiceNumbers =
    [
        "AHM-2026-014",
        "SAR-2026-021",
        "AHM-2026-018",
        "SAR-2026-027",
        "SAR-2026-028"
    ];

    public async Task<DemoSeedResult> SeedAsync(CancellationToken ct = default)
    {
        await dbContext.Database.MigrateAsync(ct);

        await using var transaction = await dbContext.Database.BeginTransactionAsync(ct);

        await ClearDemoDataAsync(ct);

        var seedData = BuildSeedData();

        dbContext.Clients.AddRange(seedData.Clients);
        dbContext.Users.AddRange(seedData.Users);
        dbContext.Invoices.AddRange(seedData.Invoices);
        dbContext.AdvanceRequests.AddRange(seedData.AdvanceRequests);
        dbContext.Transactions.AddRange(seedData.Transactions);
        dbContext.TrustScoreEvents.AddRange(seedData.TrustScoreEvents);
        dbContext.AiReviewSnapshots.AddRange(seedData.AiReviewSnapshots);

        await dbContext.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        logger.LogInformation(
            "Demo seed completed. Users={Users} Clients={Clients} Invoices={Invoices} Advances={Advances}",
            seedData.Users.Count,
            seedData.Clients.Count,
            seedData.Invoices.Count,
            seedData.AdvanceRequests.Count);

        return new DemoSeedResult(
            UsersCreated:             seedData.Users.Count,
            ClientsCreated:           seedData.Clients.Count,
            InvoicesCreated:          seedData.Invoices.Count,
            AdvanceRequestsCreated:   seedData.AdvanceRequests.Count,
            TransactionsCreated:      seedData.Transactions.Count,
            TrustScoreEventsCreated:  seedData.TrustScoreEvents.Count,
            AiReviewSnapshotsCreated: seedData.AiReviewSnapshots.Count,
            Identities:               GetDemoIdentities());
    }

    private async Task ClearDemoDataAsync(CancellationToken ct)
    {
        var demoUserIds = await dbContext.Users
            .Where(u => DemoUserEmails.Contains(u.Email))
            .Select(u => u.Id)
            .ToListAsync(ct);

        var demoClientIds = await dbContext.Clients
            .Where(c => DemoClientEmails.Contains(c.Email))
            .Select(c => c.Id)
            .ToListAsync(ct);

        var demoInvoiceIds = await dbContext.Invoices
            .Where(i =>
                demoUserIds.Contains(i.UserId)
                || demoClientIds.Contains(i.ClientId)
                || DemoInvoiceNumbers.Contains(i.InvoiceNumber))
            .Select(i => i.Id)
            .ToListAsync(ct);

        var demoAdvanceIds = await dbContext.AdvanceRequests
            .Where(a =>
                demoUserIds.Contains(a.UserId)
                || demoInvoiceIds.Contains(a.InvoiceId))
            .Select(a => a.Id)
            .ToListAsync(ct);

        await dbContext.AdminReviews
            .Where(r =>
                demoAdvanceIds.Contains(r.AdvanceRequestId)
                || demoUserIds.Contains(r.ReviewerUserId))
            .ExecuteDeleteAsync(ct);

        await dbContext.AiReviewSnapshots
            .Where(s => demoAdvanceIds.Contains(s.AdvanceRequestId))
            .ExecuteDeleteAsync(ct);

        await dbContext.Transactions
            .Where(t =>
                demoUserIds.Contains(t.UserId)
                || (t.InvoiceId.HasValue && demoInvoiceIds.Contains(t.InvoiceId.Value))
                || (t.AdvanceRequestId.HasValue && demoAdvanceIds.Contains(t.AdvanceRequestId.Value)))
            .ExecuteDeleteAsync(ct);

        await dbContext.TrustScoreEvents
            .Where(e => demoUserIds.Contains(e.UserId))
            .ExecuteDeleteAsync(ct);

        await dbContext.ClientConfirmations
            .Where(c => demoInvoiceIds.Contains(c.InvoiceId))
            .ExecuteDeleteAsync(ct);

        await dbContext.InvoiceDocuments
            .Where(d => demoInvoiceIds.Contains(d.InvoiceId))
            .ExecuteDeleteAsync(ct);

        await dbContext.AdvanceRequests
            .Where(a => demoAdvanceIds.Contains(a.Id))
            .ExecuteDeleteAsync(ct);

        await dbContext.Invoices
            .Where(i => demoInvoiceIds.Contains(i.Id))
            .ExecuteDeleteAsync(ct);

        await dbContext.SmallBusinessProfiles
            .Where(p => demoUserIds.Contains(p.UserId))
            .ExecuteDeleteAsync(ct);

        await dbContext.FreelancerProfiles
            .Where(p => demoUserIds.Contains(p.UserId))
            .ExecuteDeleteAsync(ct);

        await dbContext.Users
            .Where(u => demoUserIds.Contains(u.Id))
            .ExecuteDeleteAsync(ct);

        await dbContext.Clients
            .Where(c => demoClientIds.Contains(c.Id))
            .ExecuteDeleteAsync(ct);
    }

    private static DemoSeedData BuildSeedData()
    {
        var clients = CreateClients();
        var users = CreateUsers(out var trustScoreEvents);

        var ahmed = users.Single(u => u.Email == DemoIdentityEmails.AhmedStudio);
        var sara = users.Single(u => u.Email == DemoIdentityEmails.SaraDesigns);

        var omar = clients.Single(c => c.Email == "ap@omarhospitality.ae");
        var noura = clients.Single(c => c.Email == "ap@nouraretail.sa");
        var platform = clients.Single(c => c.Email == "payouts@nabdwork.com");
        var lynx = clients.Single(c => c.Email == "finance@lynxdigital.qa");

        var paidFactoringInvoice = CreatePaidFactoringInvoice(ahmed.Id, omar);
        var paidFactoringAdvance = CreateRepaidFactoringAdvance(paidFactoringInvoice.Id, ahmed.Id);
        paidFactoringInvoice.AttachAdvanceRequest(paidFactoringAdvance);

        var paidDiscountingInvoice = CreatePaidDiscountingInvoice(sara.Id, platform);
        var paidDiscountingAdvance = CreateRepaidDiscountingAdvance(paidDiscountingInvoice.Id, sara.Id);
        paidDiscountingInvoice.AttachAdvanceRequest(paidDiscountingAdvance);

        var draftFactoringInvoice = CreateDraftInvoice(
            userId:           ahmed.Id,
            client:           noura,
            invoiceNumber:    "AHM-2026-018",
            amount:           18_000m,
            issueDate:        new DateOnly(2026, 4, 25),
            dueDate:          new DateOnly(2026, 6, 9),
            receivableSource: ReceivableSource.DirectClientInvoice,
            description:      "Ramadan merchandising package and campaign visuals delivered.",
            paymentTerms:     "Net 45");

        var draftDiscountingInvoice = CreateDraftInvoice(
            userId:           sara.Id,
            client:           lynx,
            invoiceNumber:    "SAR-2026-027",
            amount:           2_200m,
            issueDate:        new DateOnly(2026, 4, 24),
            dueDate:          new DateOnly(2026, 5, 29),
            receivableSource: ReceivableSource.DirectClientInvoice,
            description:      "Product design sprint and landing page refresh.",
            paymentTerms:     "Net 35");

        var reviewInvoice = CreatePendingReviewInvoice(sara.Id, platform);
        var reviewAdvance = AdvanceRequest.Create(
            invoiceId:                reviewInvoice.Id,
            userId:                   sara.Id,
            financingModel:           FinancingModel.InvoiceDiscounting,
            requestedPercent:         0.8m,
            advanceAmount:            2_320m,
            feeRate:                  0.035m,
            feeAmount:                101.50m,
            settlementBufferAmount:   0m,
            expectedRepaymentAmount:  2_421.50m,
            reviewScore:              65);

        reviewAdvance.AcceptTerms();
        reviewInvoice.AttachAdvanceRequest(reviewAdvance);

        var invoices = new List<Invoice>
        {
            paidFactoringInvoice,
            paidDiscountingInvoice,
            draftFactoringInvoice,
            draftDiscountingInvoice,
            reviewInvoice
        };

        var advanceRequests = new List<AdvanceRequest>
        {
            paidFactoringAdvance,
            paidDiscountingAdvance,
            reviewAdvance
        };

        var transactions = CreateTransactions(
            ahmed.Id,
            sara.Id,
            paidFactoringInvoice.Id,
            paidFactoringAdvance.Id,
            paidDiscountingInvoice.Id,
            paidDiscountingAdvance.Id);

        var aiReviewSnapshots = new List<AiReviewSnapshot>
        {
            AiReviewSnapshot.Create(
                advanceRequestId:    reviewAdvance.Id,
                riskLevel:           AiRiskLevel.Medium,
                recommendedAction:   AiRecommendedAction.ManualReview,
                summary:             "Manual review recommended: the invoice is close to Sara Designs' current limit and no supporting document has been attached.",
                riskFlagsJson:       "[\"Supporting document is missing\",\"Invoice is close to current freelancer limit\"]",
                modelName:           "mock-ai-review-v1")
        };

        return new DemoSeedData(
            Users:             users,
            Clients:           clients,
            Invoices:          invoices,
            AdvanceRequests:   advanceRequests,
            Transactions:      transactions,
            TrustScoreEvents:  trustScoreEvents,
            AiReviewSnapshots: aiReviewSnapshots);
    }

    private static List<Client> CreateClients() =>
    [
        Client.Create("Omar Hospitality Group", "ap@omarhospitality.ae", "UAE"),
        Client.Create("Noura Retail Group", "ap@nouraretail.sa", "Saudi Arabia"),
        Client.Create("Nabd Freelance Marketplace", "payouts@nabdwork.com", "UAE"),
        Client.Create("Lynx Digital", "finance@lynxdigital.qa", "Qatar")
    ];

    private static List<User> CreateUsers(out List<TrustScoreEvent> trustScoreEvents)
    {
        var ahmed = User.CreateSmallBusiness(
            email:              DemoIdentityEmails.AhmedStudio,
            businessName:       "Ahmed Studio",
            registrationNumber: "EG-C-204188",
            phone:              "+20 100 482 1190",
            country:            "Egypt");

        ahmed.SmallBusinessProfile!.UpdateBankAccount("Ahmed Studio LLC", "4481");

        var sara = User.CreateFreelancer(
            email:    DemoIdentityEmails.SaraDesigns,
            fullName: "Sara Designs",
            phone:    "+20 111 624 3017",
            country:  "Egypt");

        sara.FreelancerProfile!.UpdateBankAccount("Sara Mahmoud", "1190");

        var admin = User.CreateSmallBusiness(
            email:              DemoIdentityEmails.AdminReviewer,
            businessName:       "Hassil Admin",
            registrationNumber: "HASSIL-SBX",
            phone:              "+971 55 438 9021",
            country:            "UAE");

        admin.SmallBusinessProfile!.UpdateBankAccount("Hassil Review Desk", "0001");
        admin.PromoteToAdmin();

        trustScoreEvents =
        [
            ahmed.SetTrustScore(60, "Demo baseline after completed factoring repayment."),
            sara.SetTrustScore(55, "Demo baseline after completed discounting repayment."),
            admin.SetTrustScore(100, "Demo admin reviewer baseline.")
        ];

        return [ahmed, sara, admin];
    }

    private static Invoice CreatePaidFactoringInvoice(Guid userId, Client client)
    {
        var invoice = Invoice.Create(
            userId:             userId,
            clientId:           client.Id,
            invoiceNumber:      "AHM-2026-014",
            amount:             20_000m,
            issueDate:          new DateOnly(2026, 3, 1),
            dueDate:            new DateOnly(2026, 4, 20),
            invoiceFingerprint: CreateFingerprint(
                "AHM-2026-014",
                client.Email,
                20_000m,
                new DateOnly(2026, 4, 20),
                ReceivableSource.DirectClientInvoice),
            receivableSource:   ReceivableSource.DirectClientInvoice,
            description:        "Brand identity and launch assets delivered to Omar Hospitality Group.",
            paymentTerms:       "Net 45");

        invoice.AddDocument(InvoiceDocument.Create(
            invoice.Id,
            "signed-delivery-note.pdf",
            "/demo-documents/signed-delivery-note.pdf",
            "Delivery Proof"));

        invoice.Submit();
        invoice.MarkAdvanceRequested();
        invoice.RequireClientConfirmation();

        var confirmation = ClientConfirmation.Create(
            invoiceId:    invoice.Id,
            token:        "paid-factoring-token",
            clientEmail:  client.Email,
            expiresAt:    DateTimeOffset.UtcNow.AddDays(30));

        confirmation.Confirm("Work received and approved.");
        invoice.AttachClientConfirmation(confirmation);
        invoice.MarkConfirmed();
        invoice.SendToReview();
        invoice.Approve();
        invoice.MarkDisbursed();
        invoice.MarkPaid();

        return invoice;
    }

    private static AdvanceRequest CreateRepaidFactoringAdvance(Guid invoiceId, Guid userId)
    {
        var advance = AdvanceRequest.Create(
            invoiceId:               invoiceId,
            userId:                  userId,
            financingModel:          FinancingModel.InvoiceFactoring,
            requestedPercent:        0.9m,
            advanceAmount:           18_000m,
            feeRate:                 0.02m,
            feeAmount:               400m,
            settlementBufferAmount:  1_600m,
            expectedRepaymentAmount: 20_000m,
            reviewScore:             92);

        advance.AcceptTerms();
        advance.ApproveAutomatically();
        advance.Disburse();
        advance.MarkClientPaidHassil();
        advance.ReleaseBuffer();
        advance.MarkRepaid();

        return advance;
    }

    private static Invoice CreatePaidDiscountingInvoice(Guid userId, Client client)
    {
        var invoice = Invoice.Create(
            userId:             userId,
            clientId:           client.Id,
            invoiceNumber:      "SAR-2026-021",
            amount:             800m,
            issueDate:          new DateOnly(2026, 3, 12),
            dueDate:            new DateOnly(2026, 4, 10),
            invoiceFingerprint: CreateFingerprint(
                "SAR-2026-021",
                client.Email,
                800m,
                new DateOnly(2026, 4, 10),
                ReceivableSource.FreelancePlatformPayout),
            receivableSource:   ReceivableSource.FreelancePlatformPayout,
            description:        "Landing page design payout approved by marketplace client.",
            paymentTerms:       "Platform payout hold");

        invoice.AddDocument(InvoiceDocument.Create(
            invoice.Id,
            "platform-payout-proof.png",
            "/demo-documents/platform-payout-proof.png",
            "Platform Payout Proof"));

        invoice.Submit();
        invoice.MarkAdvanceRequested();
        invoice.SendToReview();
        invoice.Approve();
        invoice.MarkDisbursed();
        invoice.MarkPaid();

        return invoice;
    }

    private static AdvanceRequest CreateRepaidDiscountingAdvance(Guid invoiceId, Guid userId)
    {
        var advance = AdvanceRequest.Create(
            invoiceId:               invoiceId,
            userId:                  userId,
            financingModel:          FinancingModel.InvoiceDiscounting,
            requestedPercent:        0.8m,
            advanceAmount:           640m,
            feeRate:                 0.04m,
            feeAmount:               32m,
            settlementBufferAmount:  0m,
            expectedRepaymentAmount: 672m,
            reviewScore:             86);

        advance.AcceptTerms();
        advance.ApproveAutomatically();
        advance.Disburse();
        advance.MarkClientPaymentDetected();
        advance.MarkRepaid();

        return advance;
    }

    private static Invoice CreateDraftInvoice(
        Guid userId,
        Client client,
        string invoiceNumber,
        decimal amount,
        DateOnly issueDate,
        DateOnly dueDate,
        ReceivableSource receivableSource,
        string description,
        string paymentTerms)
    {
        var invoice = Invoice.Create(
            userId:             userId,
            clientId:           client.Id,
            invoiceNumber:      invoiceNumber,
            amount:             amount,
            issueDate:          issueDate,
            dueDate:            dueDate,
            invoiceFingerprint: CreateFingerprint(
                invoiceNumber,
                client.Email,
                amount,
                dueDate,
                receivableSource),
            receivableSource:   receivableSource,
            description:        description,
            paymentTerms:       paymentTerms);

        invoice.AddDocument(InvoiceDocument.Create(
            invoice.Id,
            $"{invoiceNumber.ToLowerInvariant()}-support.pdf",
            $"/demo-documents/{invoiceNumber.ToLowerInvariant()}-support.pdf",
            "Purchase Order"));

        return invoice;
    }

    private static Invoice CreatePendingReviewInvoice(Guid userId, Client client)
    {
        var invoice = Invoice.Create(
            userId:             userId,
            clientId:           client.Id,
            invoiceNumber:      "SAR-2026-028",
            amount:             2_900m,
            issueDate:          new DateOnly(2026, 4, 26),
            dueDate:            new DateOnly(2026, 6, 20),
            invoiceFingerprint: CreateFingerprint(
                "SAR-2026-028",
                client.Email,
                2_900m,
                new DateOnly(2026, 6, 20),
                ReceivableSource.FreelancePlatformPayout),
            receivableSource:   ReceivableSource.FreelancePlatformPayout,
            description:        "Marketplace payout close to current freelancer limit.",
            paymentTerms:       "Platform payout review");

        invoice.Submit();
        invoice.MarkAdvanceRequested();
        invoice.SendToReview();

        return invoice;
    }

    private static List<Transaction> CreateTransactions(
        Guid ahmedId,
        Guid saraId,
        Guid factoringInvoiceId,
        Guid factoringAdvanceId,
        Guid discountingInvoiceId,
        Guid discountingAdvanceId) =>
    [
        Transaction.Create(
            userId:           ahmedId,
            type:             TransactionType.AdvanceDisbursement,
            direction:        TransactionDirection.Credit,
            amount:           18_000m,
            invoiceId:        factoringInvoiceId,
            advanceRequestId: factoringAdvanceId,
            description:      "Advance sent to Ahmed Studio bank account."),
        Transaction.Create(
            userId:           ahmedId,
            type:             TransactionType.ClientPaymentToHassil,
            direction:        TransactionDirection.Credit,
            amount:           20_000m,
            invoiceId:        factoringInvoiceId,
            advanceRequestId: factoringAdvanceId,
            description:      "Client payment received by Hassil collection account."),
        Transaction.Create(
            userId:           ahmedId,
            type:             TransactionType.PlatformFee,
            direction:        TransactionDirection.Internal,
            amount:           400m,
            invoiceId:        factoringInvoiceId,
            advanceRequestId: factoringAdvanceId,
            description:      "Fixed upfront fee collected from settlement."),
        Transaction.Create(
            userId:           ahmedId,
            type:             TransactionType.BufferRelease,
            direction:        TransactionDirection.Credit,
            amount:           1_600m,
            invoiceId:        factoringInvoiceId,
            advanceRequestId: factoringAdvanceId,
            description:      "Remaining settlement buffer released to Ahmed Studio."),
        Transaction.Create(
            userId:           saraId,
            type:             TransactionType.AdvanceDisbursement,
            direction:        TransactionDirection.Credit,
            amount:           640m,
            invoiceId:        discountingInvoiceId,
            advanceRequestId: discountingAdvanceId,
            description:      "Advance sent to Sara Designs."),
        Transaction.Create(
            userId:           saraId,
            type:             TransactionType.DetectedIncomingPayment,
            direction:        TransactionDirection.Internal,
            amount:           800m,
            invoiceId:        discountingInvoiceId,
            advanceRequestId: discountingAdvanceId,
            description:      "Platform payout detected in Sara account."),
        Transaction.Create(
            userId:           saraId,
            type:             TransactionType.UserRepayment,
            direction:        TransactionDirection.Debit,
            amount:           672m,
            invoiceId:        discountingInvoiceId,
            advanceRequestId: discountingAdvanceId,
            description:      "Sara repaid Hassil after receiving the client payment."),
        Transaction.Create(
            userId:           saraId,
            type:             TransactionType.PlatformFee,
            direction:        TransactionDirection.Internal,
            amount:           32m,
            invoiceId:        discountingInvoiceId,
            advanceRequestId: discountingAdvanceId,
            description:      "Fixed upfront fee collected at repayment.")
    ];

    private static string CreateFingerprint(
        string invoiceNumber,
        string clientEmail,
        decimal amount,
        DateOnly dueDate,
        ReceivableSource source)
    {
        var raw = string.Join(
                '|',
                invoiceNumber.Trim().ToLowerInvariant(),
                clientEmail.Trim().ToLowerInvariant(),
                amount.ToString("0.00", CultureInfo.InvariantCulture),
                dueDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                source.ToString())
            .ToLowerInvariant();

        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)))
            .ToLowerInvariant();
    }

    private static IReadOnlyList<DemoIdentity> GetDemoIdentities() =>
    [
        new(
            Persona:     "small_business",
            DisplayName: "Ahmed Studio",
            Email:       DemoIdentityEmails.AhmedStudio,
            Role:        "User",
            AccountType: "SmallBusiness"),
        new(
            Persona:     "freelancer",
            DisplayName: "Sara Designs",
            Email:       DemoIdentityEmails.SaraDesigns,
            Role:        "User",
            AccountType: "Freelancer"),
        new(
            Persona:     "client",
            DisplayName: "Omar Client",
            Email:       "ap@omarhospitality.ae",
            Role:        "Client",
            AccountType: "Client"),
        new(
            Persona:     "admin",
            DisplayName: "Admin Reviewer",
            Email:       DemoIdentityEmails.AdminReviewer,
            Role:        "Admin",
            AccountType: "SmallBusiness")
    ];

    private sealed record DemoSeedData(
        List<User> Users,
        List<Client> Clients,
        List<Invoice> Invoices,
        List<AdvanceRequest> AdvanceRequests,
        List<Transaction> Transactions,
        List<TrustScoreEvent> TrustScoreEvents,
        List<AiReviewSnapshot> AiReviewSnapshots);
}
