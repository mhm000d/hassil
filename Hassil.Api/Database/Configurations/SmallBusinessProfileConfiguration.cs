using Hassil.Api.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hassil.Api.Database.Configurations;

public sealed class SmallBusinessProfileConfiguration : IEntityTypeConfiguration<SmallBusinessProfile>
{
    public void Configure(EntityTypeBuilder<SmallBusinessProfile> builder)
    {
        builder.ToTable("SmallBusinessProfiles");

        builder.HasKey(x => x.UserId);
        builder.Property(x => x.UserId).ValueGeneratedNever();

        builder.Property(x => x.BusinessName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.RegistrationNumber)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.BusinessBankAccountName)
            .HasMaxLength(200);

        builder.Property(x => x.BusinessBankAccountLast4)
            .HasMaxLength(4);

        builder.Property(x => x.VerificationStatus)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.HasIndex(x => x.RegistrationNumber)
            .IsUnique();

        builder.HasOne(x => x.User)
            .WithOne(x => x.SmallBusinessProfile)
            .HasForeignKey<SmallBusinessProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
