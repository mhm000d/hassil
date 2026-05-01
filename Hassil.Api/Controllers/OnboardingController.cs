using Hassil.Api.Contracts.Onboarding;
using Hassil.Api.Mappings;
using Hassil.Api.Services.Onboarding;
using Microsoft.AspNetCore.Mvc;

namespace Hassil.Api.Controllers;

[ApiController]
public class OnboardingController(IOnboardingService onboardingService) : ControllerBase
{
    [HttpPost(ApiEndpoints.Onboarding.SmallBusiness)]
    public async Task<IActionResult> SmallBusiness(
        [FromBody] CreateSmallBusinessOnboardingRequest request,
        CancellationToken ct)
    {
        try
        {
            var authResult = await onboardingService.CreateSmallBusinessAsync(request, ct);
            var response = authResult.ToResponse();
            return Ok(response);
        }
        catch (Exception ex)
        {
            // Log the exception details
            Console.WriteLine($"Onboarding error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw;
        }
    }

    [HttpPost(ApiEndpoints.Onboarding.Freelancer)]
    public async Task<IActionResult> Freelancer(
        [FromBody] CreateFreelancerOnboardingRequest request,
        CancellationToken ct)
    {
        var authResult = await onboardingService.CreateFreelancerAsync(request, ct);
        return Ok(authResult.ToResponse());
    }
}
