using Hassil.Api.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hassil.Api.Database.Configurations;

public sealed class AdvanceRequestConfiguration : IEntityTypeConfiguration<AdvanceRequest>
{
    public void Configure(EntityTypeBuilder<AdvanceRequest> builder)
    {
        builder.ToTable("AdvanceRequests");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.FinancingModel)
            .HasConversion<string>()
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(x => x.RepaymentParty)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.PaymentDestination)
            .HasConversion<string>()
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(x => x.FeeCollectionTiming)
            .HasConversion<string>()
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(x => x.RequestedPercent)
            .HasPrecision(5, 4);

        builder.Property(x => x.AdvanceAmount)
            .HasPrecision(18, 2);

        builder.Property(x => x.FeeRate)
            .HasPrecision(5, 4);

        builder.Property(x => x.FeeAmount)
            .HasPrecision(18, 2);

        builder.Property(x => x.SettlementBufferAmount)
            .HasPrecision(18, 2);

        builder.Property(x => x.ExpectedRepaymentAmount)
            .HasPrecision(18, 2);

        builder.Property(x => x.ApprovalMode)
            .HasConversion<string>()
            .HasMaxLength(32);

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(x => x.RejectionReason)
            .HasMaxLength(1000);

        builder.Property(x => x.TermsVersion)
            .HasMaxLength(64)
            .IsRequired();

        builder.HasIndex(x => x.InvoiceId)
            .IsUnique();

        builder.HasOne(x => x.Invoice)
            .WithOne(x => x.AdvanceRequest)
            .HasForeignKey<AdvanceRequest>(x => x.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.User)
            .WithMany(x => x.AdvanceRequests)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
