using Hassil.Api.Authentication;
using Hassil.Api.Database;
using Hassil.Api.Middleware;
using Hassil.Api.Services.Auth;
using Hassil.Api.Services.AdvanceRequests;
using Hassil.Api.Services.AdminReviews;
using Hassil.Api.Services.ClientConfirmations;
using Hassil.Api.Services.Dashboard;
using Hassil.Api.Services.Demo;
using Hassil.Api.Services.Invoices;
using Hassil.Api.Services.Ledger;
using Hassil.Api.Services.Notifications;
using Hassil.Api.Services.Onboarding;
using Hassil.Api.Services.OpenBanking;
using Hassil.Api.Services.Transactions;
using Hassil.Api.Services.TrustScores;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
{
    builder.WebHost.UseUrls($"http://*:{port}");
}
else
{
    builder.WebHost.UseUrls("http://*:8080");
}

builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddAuthentication(DemoBearerAuthenticationDefaults.Scheme)
    .AddScheme<AuthenticationSchemeOptions, DemoBearerAuthenticationHandler>(
        DemoBearerAuthenticationDefaults.Scheme,
        _ => { });
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultCorsPolicy", policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

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
        Description = "Enter only the access token returned by demo login or onboarding."
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
builder.Services.AddScoped<IOnboardingService, OnboardingService>();
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
builder.Services.AddScoped<IAiReviewService, AiReviewService>();
builder.Services.AddScoped<IAdminReviewService, AdminReviewService>();
builder.Services.AddScoped<ITrustScoreService, TrustScoreService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<HassilDbContext>();
    try
    {
        dbContext.Database.Migrate();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Database migration failed during startup.");
        throw;
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ErrorHandlingMiddleware>();

app.UseForwardedHeaders();
app.UseHttpsRedirection();
app.UseCors("DefaultCorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
