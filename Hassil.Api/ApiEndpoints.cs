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

    // -- Advance Request Endpoints -------------------------------------------
    public static class AdvanceRequests
    {
        private const string Base = $"{ApiBase}/advance-requests";

        public const string Quote = $"{Base}/quote";
        public const string Create = Base;
        public const string GetAll = Base;
        public const string Get = $"{Base}/{{id:guid}}";
        public const string SimulateDisbursement = $"{Base}/{{id:guid}}/simulate-disbursement";
        public const string SimulateClientPaymentDetected = $"{Base}/{{id:guid}}/simulate-client-payment-detected";
        public const string SimulateUserRepayment = $"{Base}/{{id:guid}}/simulate-user-repayment";
        public const string SimulateClientPaymentToHassil = $"{Base}/{{id:guid}}/simulate-client-payment-to-hassil";
        public const string SimulateBufferRelease = $"{Base}/{{id:guid}}/simulate-buffer-release";
    }

    // -- Client Confirmation Endpoints ---------------------------------------
    public static class ClientConfirmations
    {
        private const string Base = $"{ApiBase}/client-confirmations";

        public const string Get = $"{Base}/{{token}}";
        public const string Confirm = $"{Base}/{{token}}/confirm";
        public const string Dispute = $"{Base}/{{token}}/dispute";
    }
}
