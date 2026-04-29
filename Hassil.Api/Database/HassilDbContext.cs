using Hassil.Api.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Hassil.Api.Database;

public class HassilDbContext(DbContextOptions<HassilDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<SmallBusinessProfile> SmallBusinessProfiles => Set<SmallBusinessProfile>();
    public DbSet<FreelancerProfile> FreelancerProfiles => Set<FreelancerProfile>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceDocument> InvoiceDocuments => Set<InvoiceDocument>();
    public DbSet<ClientConfirmation> ClientConfirmations => Set<ClientConfirmation>();
    public DbSet<AdvanceRequest> AdvanceRequests => Set<AdvanceRequest>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<TrustScoreEvent> TrustScoreEvents => Set<TrustScoreEvent>();
    public DbSet<AdminReview> AdminReviews => Set<AdminReview>();
    public DbSet<AiReviewSnapshot> AiReviewSnapshots => Set<AiReviewSnapshot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(HassilDbContext).Assembly);
    }

    // protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    // {
    //     base.OnConfiguring(optionsBuilder);
    //     optionsBuilder.ConfigureWarnings(w =>
    //         w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    // }
}
