namespace Hassil.Api.Contracts.Auth;

// Persona accepted values:
// "small_business" | "freelancer" | "admin"
// Aliases for the seeded identities are also accepted by the service.
public record DemoLoginRequest(string Persona);
