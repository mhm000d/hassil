namespace Hassil.Api;

public static class ApiEndpoints
{
    private const string ApiBase = "api";

    // -- Auth Endpoints -------------------------------------------------------
    public static class Auth
    {
        private const string Base = $"{ApiBase}/auth";

        public const string DemoLogin = $"{Base}/demo-login";
    }

    // -- Demo Endpoints -------------------------------------------------------
    public static class Demo
    {
        private const string Base = $"{ApiBase}/demo";

        public const string Seed = $"{Base}/seed";
    }

    // -- User Endpoints -------------------------------------------------------
    public static class Users
    {
        private const string Base = $"{ApiBase}/users";

        public const string Me = $"{Base}/me";
    }
}
