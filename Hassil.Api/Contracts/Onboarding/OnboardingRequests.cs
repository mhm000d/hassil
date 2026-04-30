using System.ComponentModel.DataAnnotations;

namespace Hassil.Api.Contracts.Onboarding;

public record OnboardSmallBusinessRequest(
    [Required, EmailAddress] string Email,
    [Required] string BusinessName,
    [Required] string RegistrationNumber,
    string? Phone,
    string? Country,
    string? Password);

public record OnboardFreelancerRequest(
    [Required, EmailAddress] string Email,
    [Required] string FullName,
    string? Phone,
    string? Country,
    string? Password);
