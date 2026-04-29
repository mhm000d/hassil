using Hassil.Api.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hassil.Api.Database.Configurations;

public sealed class FreelancerProfileConfiguration : IEntityTypeConfiguration<FreelancerProfile>
{
    public void Configure(EntityTypeBuilder<FreelancerProfile> builder)
    {
        builder.ToTable("FreelancerProfiles");

        builder.HasKey(x => x.UserId);
        builder.Property(x => x.UserId).ValueGeneratedNever();

        builder.Property(x => x.FullName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.PersonalBankAccountName)
            .HasMaxLength(200);

        builder.Property(x => x.PersonalBankAccountLast4)
            .HasMaxLength(4);

        builder.Property(x => x.VerificationStatus)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.HasOne(x => x.User)
            .WithOne(x => x.FreelancerProfile)
            .HasForeignKey<FreelancerProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
