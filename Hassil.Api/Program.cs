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
using Npgsql;

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
#pragma warning disable ASPDEPR005
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
#pragma warning restore ASPDEPR005
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

var connectionString = ResolvePostgresConnectionString(builder.Configuration);

builder.Services.AddDbContext<HassilDbContext>(options =>
    options.UseNpgsql(connectionString));

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

static string ResolvePostgresConnectionString(IConfiguration configuration)
{
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrWhiteSpace(databaseUrl))
    {
        return ConvertPostgresUrlToConnectionString(databaseUrl);
    }

    var connectionString = configuration.GetConnectionString("DefaultConnection");
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException("Connection string is not configured.");
    }

    return ConvertPostgresUrlToConnectionString(connectionString);
}

static string ConvertPostgresUrlToConnectionString(string connectionString)
{
    if (!connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
        !connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        return connectionString;
    }

    var uri = new Uri(connectionString);
    var userInfo = uri.UserInfo.Split(':', 2);
    var builder = new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Username = userInfo.Length > 0 ? userInfo[0] : string.Empty,
        Password = userInfo.Length > 1 ? userInfo[1] : string.Empty,
        Database = uri.AbsolutePath.TrimStart('/'),
        SslMode = SslMode.Require
    };

    if (!string.IsNullOrEmpty(uri.Query))
    {
        var queryParts = uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries);
        foreach (var part in queryParts)
        {
            var pair = part.Split('=', 2);
            if (pair.Length == 2)
            {
                builder[pair[0]] = Uri.UnescapeDataString(pair[1]);
            }
        }
    }

    return builder.ConnectionString;
}

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
