# SPEC-1-Hassil-Cash-Flow Brief

**[Spec-1 Hassil Cash Flow In Detail](./spec_1_hassil_cash_flow_in_detail.md)**
* [Product Model](./spec_1_hassil_cash_flow_in_detail.md#2-product-model)
* [Requirements](./spec_1_hassil_cash_flow_in_detail.md#requirements)
* [Technical Approach](./spec_1_hassil_cash_flow_in_detail.md#1-technical-approach)
* [API Contract](./spec_1_hassil_cash_flow_in_detail.md#15-api-contract)
* [Invoice Fingerprint Logic](./spec_1_hassil_cash_flow_in_detail.md#9-invoice-fingerprint-logic)
* [Advance Calculation Rules](./spec_1_hassil_cash_flow_in_detail.md#10-advance-calculation-rules)
* [Review Scoring and Approval Algorithm](./spec_1_hassil_cash_flow_in_detail.md#11-review-scoring-and-approval-algorithm)
* [Trust Score Rules](./spec_1_hassil_cash_flow_in_detail.md#13-trust-score-rules)
* [Backend Service Structure](./spec_1_hassil_cash_flow_in_detail.md#16-backend-service-structure)
* [Frontend Page Structure](./spec_1_hassil_cash_flow_in_detail.md#17-frontend-page-structure)
* [Admin Review Page](./spec_1_hassil_cash_flow_in_detail.md#18-admin-review-page)
* [Demo Data](./spec_1_hassil_cash_flow_in_detail.md#19-demo-data)
* [Build Steps](./spec_1_hassil_cash_flow_in_detail.md#build-steps)
* [Demo Acceptance Criteria](./spec_1_hassil_cash_flow_in_detail.md#demo-acceptance-criteria)

## API Contracts

Full contract: [API Contract](./spec_1_hassil_cash_flow_in_detail.md#15-api-contract)

### Auth and Demo

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/demo-login` | Log in as seeded small business, freelancer, or admin |
| POST | `/api/demo/seed` | Seed demo data |

### Onboarding

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/onboarding/small-business` | Create small business profile |
| POST | `/api/onboarding/freelancer` | Create freelancer profile |
| GET | `/api/users/me` | Get current user, profile, and trust score |

### Invoices

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/invoices` | Create invoice |
| GET | `/api/invoices` | List current user's invoices |
| GET | `/api/invoices/{id}` | Get invoice details |
| POST | `/api/invoices/{id}/documents` | Upload supporting document placeholder |
| POST | `/api/invoices/{id}/submit` | Submit invoice for advance eligibility |

### Advance Requests

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/advance-requests/quote` | Calculate advance, fee, buffer, repayment amount, eligibility |
| POST | `/api/advance-requests` | Create advance request and store accepted terms |
| GET | `/api/advance-requests` | List current user's advance requests |
| GET | `/api/advance-requests/{id}` | Get advance details |
| POST | `/api/advance-requests/{id}/simulate-disbursement` | Simulate approved advance release |
| POST | `/api/advance-requests/{id}/simulate-client-payment-detected` | Simulate freelancer client payment detection |
| POST | `/api/advance-requests/{id}/simulate-user-repayment` | Simulate freelancer repayment |
| POST | `/api/advance-requests/{id}/simulate-client-payment-to-hassil` | Simulate factoring client payment to Hassil |
| POST | `/api/advance-requests/{id}/simulate-buffer-release` | Simulate settlement buffer release |

### Client Confirmation

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/client-confirmations/{token}` | Get confirmation details |
| POST | `/api/client-confirmations/{token}/confirm` | Confirm invoice and payment redirection |
| POST | `/api/client-confirmations/{token}/dispute` | Dispute invoice |

### Admin Review

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/advance-requests/pending` | List pending manual reviews |
| GET | `/api/admin/advance-requests/{id}` | View flags, AI summary, checklist |
| POST | `/api/admin/advance-requests/{id}/approve` | Approve manually |
| POST | `/api/admin/advance-requests/{id}/reject` | Reject with reason |
| POST | `/api/admin/advance-requests/{id}/request-more-info` | Request more evidence |
| POST | `/api/admin/advance-requests/{id}/ai-review` | Generate/refresh AI review summary |

### Dashboard

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/dashboard/summary` | Summary cards and model-specific activity |
| GET | `/api/transactions` | Transaction history |
| GET | `/api/trust-score/events` | Trust score history |

### Services

| Service | Responsibility |
|---|---|
| `InvoiceFingerprintService` | Duplicate-detection hash |
| `AdvanceCalculatorService` | Advance, fee, buffer, repayment values |
| `ReviewScoringService` | Deterministic review rules |
| `AiReviewService` | Admin-facing AI summary |
| `TrustScoreService` | Trust score and events |
| `LedgerService` | Ledger transactions |
| `MockOpenBankingGateway` | Simulated Open Banking read/write |
| `MockNotificationService` | Confirmation token and email preview |
| `DemoSeedService` | Demo users, invoices, advances, transactions |

## Frontend Structure

Full structure: [Frontend Page Structure](./spec_1_hassil_cash_flow_in_detail.md#17-frontend-page-structure)

### Routes

| Route | Page |
|---|---|
| `/` | Landing and account-type selection |
| `/onboarding/small-business` | Small business onboarding |
| `/onboarding/freelancer` | Freelancer onboarding |
| `/login` | Demo login |
| `/dashboard` | User dashboard |
| `/invoices/new` | Invoice builder |
| `/invoices/:id` | Invoice detail |
| `/invoices/:id/advance` | Advance quote and request |
| `/advances/:id` | Advance detail and repayment status |
| `/client/confirm/:token` | Public client confirmation page |
| `/admin` | Admin review dashboard |
| `/admin/advances/:id` | Admin review detail |
| `/transactions` | User transaction history |

## Admin Review

Full detail: [Admin Review Page](./spec_1_hassil_cash_flow_in_detail.md#18-admin-review-page)

### Review Fields

- User type.
- Financing model.
- Repayment party.
- Client notification required.
- User profile completeness.
- Trust score.
- Invoice amount.
- Due date.
- Requested advance percentage.
- Fee amount.
- Fee rate.
- Supporting document status.
- Duplicate invoice result.
- Client confirmation status.
- Review score.
- AI Review Summary.
- Review flags.
- Recommended decision.

### Actions

- Approve.
- Reject with reason.
- Request more information.
- Refresh AI review summary.

## Linked Detail In-depth

- [Main Roles](./spec_1_hassil_cash_flow_in_detail.md#3-main-roles)
- [High-Level Architecture](./spec_1_hassil_cash_flow_in_detail.md#4-high-level-architecture)
- [Core Flow: Freelancer Discounting](./spec_1_hassil_cash_flow_in_detail.md#5-core-flow-freelancer-discounting)
- [Core Flow: Small Business Factoring](./spec_1_hassil_cash_flow_in_detail.md#6-core-flow-small-business-factoring)
- [Invoice and Advance State Model](./spec_1_hassil_cash_flow_in_detail.md#7-invoice-and-advance-state-model)
- [AI Review Assistant](./spec_1_hassil_cash_flow_in_detail.md#12-ai-review-assistant)
- [Mock Open Banking Adapter](./spec_1_hassil_cash_flow_in_detail.md#14-mock-open-banking-adapter)
- [Comparable Product Patterns](./spec_1_hassil_cash_flow_in_detail.md#20-comparable-product-patterns)
- [Team Split](./spec_1_hassil_cash_flow_in_detail.md#team-split)
- [Milestones](./spec_1_hassil_cash_flow_in_detail.md#milestones)
- [Gathering Results](./spec_1_hassil_cash_flow_in_detail.md#gathering-results)
