using Hassil.Api.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hassil.Api.Database.Configurations;

public sealed class ClientConfirmationConfiguration : IEntityTypeConfiguration<ClientConfirmation>
{
    public void Configure(EntityTypeBuilder<ClientConfirmation> builder)
    {
        builder.ToTable("ClientConfirmations");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.Token)
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(x => x.ClientEmail)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.ClientNote)
            .HasMaxLength(1000);

        builder.HasIndex(x => x.Token)
            .IsUnique();

        builder.HasIndex(x => x.InvoiceId)
            .IsUnique();

        builder.HasOne(x => x.Invoice)
            .WithOne(x => x.ClientConfirmation)
            .HasForeignKey<ClientConfirmation>(x => x.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
