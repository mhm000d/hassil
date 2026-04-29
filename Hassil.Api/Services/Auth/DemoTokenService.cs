using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Hassil.Api.Domain.Models;

namespace Hassil.Api.Services.Auth;

public class DemoTokenService(IConfiguration configuration) : IDemoTokenService
{
    private const string TokenVersion = "hassil-demo-v1";

    public DemoToken IssueToken(User user)
    {
        var issuedAt = DateTimeOffset.UtcNow;
        var expiresAt = issuedAt.AddMinutes(GetAccessTokenMinutes());

        var payload = new DemoTokenPayload(
            Sub:         user.Id,
            Email:       user.Email,
            Role:        user.Role.ToString(),
            AccountType: user.AccountType.ToString(),
            Iat:         issuedAt.ToUnixTimeSeconds(),
            Exp:         expiresAt.ToUnixTimeSeconds(),
            Jti:         Guid.NewGuid().ToString("N", CultureInfo.InvariantCulture));

        var payloadBytes = JsonSerializer.SerializeToUtf8Bytes(payload);
        var payloadSegment = Base64UrlEncode(payloadBytes);
        var signatureSegment = Sign(payloadSegment);

        return new DemoToken(
            AccessToken: $"{TokenVersion}.{payloadSegment}.{signatureSegment}",
            ExpiresAt:   expiresAt);
    }

    public DemoTokenPrincipal? ValidateToken(string accessToken)
    {
        var parts = accessToken.Split('.');
        if (parts.Length != 3 || parts[0] != TokenVersion)
            return null;

        var expectedSignature = Sign(parts[1]);
        if (!FixedTimeEquals(expectedSignature, parts[2]))
            return null;

        DemoTokenPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<DemoTokenPayload>(Base64UrlDecode(parts[1]));
        }
        catch
        {
            return null;
        }

        if (payload is null)
            return null;

        var expiresAt = DateTimeOffset.FromUnixTimeSeconds(payload.Exp);
        if (expiresAt <= DateTimeOffset.UtcNow)
            return null;

        return new DemoTokenPrincipal(
            UserId:      payload.Sub,
            Email:       payload.Email,
            Role:        payload.Role,
            AccountType: payload.AccountType,
            ExpiresAt:   expiresAt);
    }

    private string Sign(string payloadSegment)
    {
        var signingInput = $"{TokenVersion}.{payloadSegment}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(GetSigningKey()));
        return Base64UrlEncode(hmac.ComputeHash(Encoding.UTF8.GetBytes(signingInput)));
    }

    private string GetSigningKey() =>
        configuration["Authentication:TokenSigningKey"]
        ?? "hassil-local-demo-signing-key-change-before-production";

    private int GetAccessTokenMinutes() =>
        int.TryParse(
            configuration["Authentication:AccessTokenMinutes"],
            NumberStyles.Integer,
            CultureInfo.InvariantCulture,
            out var minutes)
            ? Math.Clamp(minutes, 15, 24 * 60)
            : 8 * 60;

    private static bool FixedTimeEquals(string left, string right)
    {
        var leftBytes = Encoding.UTF8.GetBytes(left);
        var rightBytes = Encoding.UTF8.GetBytes(right);

        return leftBytes.Length == rightBytes.Length
               && CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

    private static byte[] Base64UrlDecode(string value)
    {
        var padded = value
            .Replace('-', '+')
            .Replace('_', '/');

        padded = padded.PadRight(padded.Length + (4 - padded.Length % 4) % 4, '=');
        return Convert.FromBase64String(padded);
    }

    private record DemoTokenPayload(
        Guid Sub,
        string Email,
        string Role,
        string AccountType,
        long Iat,
        long Exp,
        string Jti);
}
