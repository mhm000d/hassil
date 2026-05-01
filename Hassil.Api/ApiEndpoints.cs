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

    // -- Onboarding Endpoints ------------------------------------------------
    public static class Onboarding
    {
        private const string Base = $"{ApiBase}/onboarding";

        public const string SmallBusiness = $"{Base}/small-business";
        public const string Freelancer = $"{Base}/freelancer";
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

    // -- Trust Score Endpoints ----------------------------------------------
    public static class TrustScores
    {
        private const string Base = $"{ApiBase}/trust-score";

        public const string Events = $"{Base}/events";
    }

    // -- Dashboard Endpoints -------------------------------------------------
    public static class Dashboard
    {
        private const string Base = $"{ApiBase}/dashboard";

        public const string Summary = $"{Base}/summary";
    }

    // -- Transaction Endpoints ----------------------------------------------
    public static class Transactions
    {
        private const string Base = $"{ApiBase}/transactions";

        public const string GetAll = Base;
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
    }

    // -- Client Confirmation Endpoints ---------------------------------------
    public static class ClientConfirmations
    {
        private const string Base = $"{ApiBase}/client-confirmations";

        public const string Get = $"{Base}/{{token}}";
        public const string Confirm = $"{Base}/{{token}}/confirm";
        public const string Dispute = $"{Base}/{{token}}/dispute";
    }

    // -- Admin Review Endpoints ---------------------------------------------
    public static class Admin
    {
        private const string AdvanceBase = $"{ApiBase}/admin/advance-requests";

        public const string GetPendingAdvanceRequests = $"{AdvanceBase}/pending";
        public const string GetAdvanceRequest = $"{AdvanceBase}/{{id:guid}}";
        public const string ApproveAdvanceRequest = $"{AdvanceBase}/{{id:guid}}/approve";
        public const string RejectAdvanceRequest = $"{AdvanceBase}/{{id:guid}}/reject";
        public const string RequestMoreInfo = $"{AdvanceBase}/{{id:guid}}/request-more-info";
        public const string GenerateAiReview = $"{AdvanceBase}/{{id:guid}}/ai-review";
        public const string SendClientConfirmation = $"{AdvanceBase}/{{id:guid}}/send-client-confirmation";
        public const string ApproveAndDisburse = $"{AdvanceBase}/{{id:guid}}/approve-and-disburse";
        public const string SimulateDisbursement = $"{AdvanceBase}/{{id:guid}}/simulate-disbursement";
        public const string SimulateClientPaymentDetected = $"{AdvanceBase}/{{id:guid}}/simulate-client-payment-detected";
        public const string SimulateUserRepayment = $"{AdvanceBase}/{{id:guid}}/simulate-user-repayment";
        public const string SimulateClientPaymentToHassil = $"{AdvanceBase}/{{id:guid}}/simulate-client-payment-to-hassil";
        public const string SimulateBufferRelease = $"{AdvanceBase}/{{id:guid}}/simulate-buffer-release";
    }
}
