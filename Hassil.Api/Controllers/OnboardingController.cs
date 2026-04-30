using Hassil.Api.Contracts.Onboarding;
using Hassil.Api.Mappings;
using Hassil.Api.Services.Onboarding;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hassil.Api.Controllers;

[ApiController]
[AllowAnonymous]
public class OnboardingController(IOnboardingService onboardingService) : ControllerBase
{
    [HttpPost(ApiEndpoints.Onboarding.SmallBusiness)]
    public async Task<IActionResult> OnboardSmallBusiness(
        [FromBody] OnboardSmallBusinessRequest request,
        CancellationToken ct)
    {
        var authResult = await onboardingService.OnboardSmallBusinessAsync(request, ct);
        return Ok(authResult.ToResponse());
    }

    [HttpPost(ApiEndpoints.Onboarding.Freelancer)]
    public async Task<IActionResult> OnboardFreelancer(
        [FromBody] OnboardFreelancerRequest request,
        CancellationToken ct)
    {
        var authResult = await onboardingService.OnboardFreelancerAsync(request, ct);
        return Ok(authResult.ToResponse());
    }
}
