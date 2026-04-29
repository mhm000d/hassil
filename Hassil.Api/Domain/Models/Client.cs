namespace Hassil.Api.Domain.Models;

public class Client
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public string? Country { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    // Navigation Properties
    public ICollection<Invoice> Invoices { get; private set; } = [];

    // Factory
    public static Client Create(string name, string email, string? country = null)
    {
        return new Client
        {
            Id = Guid.NewGuid(),
            Name = Required(name, nameof(name)),
            Email = Required(email, nameof(email)),
            Country = Optional(country),
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void UpdateContact(string name, string email, string? country = null)
    {
        Name = Required(name, nameof(name));
        Email = Required(email, nameof(email));
        Country = Optional(country);
    }

    public void AddInvoice(Invoice invoice) => Invoices.Add(invoice);

    // Helpers
    private static string Required(string value, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException($"{parameterName} is required.", parameterName);

        return value.Trim();
    }

    private static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
