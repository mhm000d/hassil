using Hassil.Api.Mappings;
using Hassil.Api.Services.Demo;
using Microsoft.AspNetCore.Mvc;

namespace Hassil.Api.Controllers;

[ApiController]
public class DemoController(IDemoSeedService demoSeedService) : ControllerBase
{
    [HttpPost(ApiEndpoints.Demo.Seed)]
    public async Task<IActionResult> Seed(CancellationToken ct)
    {
        var result = await demoSeedService.SeedAsync(ct);
        return Ok(result.ToResponse());
    }
}
