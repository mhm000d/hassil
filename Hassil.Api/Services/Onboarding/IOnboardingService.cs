using Hassil.Api.Contracts.Onboarding;
using Hassil.Api.Services.Auth;

namespace Hassil.Api.Services.Onboarding;

public interface IOnboardingService
{
    Task<AuthResult> CreateSmallBusinessAsync(
        CreateSmallBusinessOnboardingRequest request,
        CancellationToken ct = default);

    Task<AuthResult> CreateFreelancerAsync(
        CreateFreelancerOnboardingRequest request,
        CancellationToken ct = default);
}
