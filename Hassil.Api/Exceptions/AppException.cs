namespace Hassil.Api.Exceptions;

public class AppException(string message, string code, int statusCode, object? details = null)
    : Exception(message)
{
    public string Code { get; } = code;
    public int StatusCode { get; } = statusCode;
    public object? Details { get; } = details;
}

public class NotFoundException(string message, string code)
    : AppException(message, code, StatusCodes.Status404NotFound);

public class ValidationException(string message, string code, object? details = null)
    : AppException(message, code, StatusCodes.Status400BadRequest, details);

public class ForbiddenException(string message, string code)
    : AppException(message, code, StatusCodes.Status403Forbidden);

public class ConflictException(string message, string code, object? details = null)
    : AppException(message, code, StatusCodes.Status409Conflict, details);

public class UnauthorizedException(string message, string code)
    : AppException(message, code, StatusCodes.Status401Unauthorized);

public class ServerException(string message, string code = "INTERNAL_ERROR")
    : AppException(message, code, StatusCodes.Status500InternalServerError);

public class EmailPermanentException(string message, Exception? inner = null)
    : Exception(message, inner);
