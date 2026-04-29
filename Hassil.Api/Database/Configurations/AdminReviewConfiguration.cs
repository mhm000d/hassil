using Hassil.Api.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hassil.Api.Database.Configurations;

public sealed class AdminReviewConfiguration : IEntityTypeConfiguration<AdminReview>
{
    public void Configure(EntityTypeBuilder<AdminReview> builder)
    {
        builder.ToTable("AdminReviews");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.Decision)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.Notes)
            .HasMaxLength(1000);

        builder.HasIndex(x => x.AdvanceRequestId);
        builder.HasIndex(x => x.ReviewerUserId);

        builder.HasOne(x => x.AdvanceRequest)
            .WithMany(x => x.AdminReviews)
            .HasForeignKey(x => x.AdvanceRequestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ReviewerUser)
            .WithMany(x => x.AdminReviews)
            .HasForeignKey(x => x.ReviewerUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
