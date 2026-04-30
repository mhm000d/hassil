using Hassil.Api.Contracts.Onboarding;
using Hassil.Api.Services.Auth;

namespace Hassil.Api.Services.Onboarding;

public interface IOnboardingService
{
    Task<AuthResult> OnboardSmallBusinessAsync(OnboardSmallBusinessRequest request, CancellationToken ct = default);
    Task<AuthResult> OnboardFreelancerAsync(OnboardFreelancerRequest request, CancellationToken ct = default);
}
