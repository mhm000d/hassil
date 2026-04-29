using Hassil.Api.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hassil.Api.Database.Configurations;

public sealed class InvoiceDocumentConfiguration : IEntityTypeConfiguration<InvoiceDocument>
{
    public void Configure(EntityTypeBuilder<InvoiceDocument> builder)
    {
        builder.ToTable("InvoiceDocuments");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.FileName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.FileUrl)
            .HasMaxLength(2048)
            .IsRequired();

        builder.Property(x => x.DocumentType)
            .HasMaxLength(64)
            .IsRequired();

        builder.HasIndex(x => x.InvoiceId);

        builder.HasOne(x => x.Invoice)
            .WithMany(x => x.Documents)
            .HasForeignKey(x => x.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
