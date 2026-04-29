using Hassil.Api.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hassil.Api.Database.Configurations;

public sealed class AiReviewSnapshotConfiguration : IEntityTypeConfiguration<AiReviewSnapshot>
{
    public void Configure(EntityTypeBuilder<AiReviewSnapshot> builder)
    {
        builder.ToTable("AiReviewSnapshots");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.RiskLevel)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.RecommendedAction)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.Summary)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(x => x.RiskFlagsJson)
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(x => x.ModelName)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(x => x.AdvanceRequestId);

        builder.HasOne(x => x.AdvanceRequest)
            .WithMany(x => x.AiReviewSnapshots)
            .HasForeignKey(x => x.AdvanceRequestId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
