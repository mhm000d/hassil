using Hassil.Api.Authentication;
using Hassil.Api.Database;
using Hassil.Api.Middleware;
using Hassil.Api.Services.Auth;
using Hassil.Api.Services.AdvanceRequests;
using Hassil.Api.Services.ClientConfirmations;
using Hassil.Api.Services.Demo;
using Hassil.Api.Services.Invoices;
using Hassil.Api.Services.Ledger;
using Hassil.Api.Services.Notifications;
using Hassil.Api.Services.OpenBanking;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddAuthentication(DemoBearerAuthenticationDefaults.Scheme)
    .AddScheme<AuthenticationSchemeOptions, DemoBearerAuthenticationHandler>(
        DemoBearerAuthenticationDefaults.Scheme,
        _ => { });
builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "Demo",
        In = ParameterLocation.Header,
        Description = "Enter only the access token returned by /api/auth/demo-login."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", document, externalResource: null),
            []
        }
    });
});

builder.Services.AddDbContext<HassilDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string is not configured.")));

builder.Services.AddSingleton<IDemoTokenService, DemoTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDemoSeedService, DemoSeedService>();
builder.Services.AddScoped<IInvoiceFingerprintService, InvoiceFingerprintService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IAdvanceCalculatorService, AdvanceCalculatorService>();
builder.Services.AddScoped<IReviewScoringService, ReviewScoringService>();
builder.Services.AddScoped<ILedgerService, LedgerService>();
builder.Services.AddScoped<IMockNotificationService, MockNotificationService>();
builder.Services.AddScoped<IOpenBankingGateway, MockOpenBankingGateway>();
builder.Services.AddScoped<IAdvanceRequestService, AdvanceRequestService>();
builder.Services.AddScoped<IClientConfirmationService, ClientConfirmationService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ErrorHandlingMiddleware>();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
