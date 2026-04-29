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

    // -- Invoice Endpoints ----------------------------------------------------
    public static class Invoices
    {
        private const string Base = $"{ApiBase}/invoices";

        public const string Create = Base;
        public const string GetAll = Base;
        public const string Get = $"{Base}/{{id:guid}}";
        public const string AddDocument = $"{Base}/{{id:guid}}/documents";
        public const string Submit = $"{Base}/{{id:guid}}/submit";
    }
}
