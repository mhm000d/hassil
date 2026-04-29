# Hassil Backend API Progress

This document explains what the backend currently supports, how the existing endpoints should be used, and the recommended next work.

## Table Of Contents

- [Current Backend Scope](#current-backend-scope)
- [How To Use Swagger Authorization](#how-to-use-swagger-authorization)
- [Implemented APIs](#implemented-apis)
  - [Demo Seed](#demo-seed)
  - [Demo Login](#demo-login)
  - [Current User](#current-user)
  - [Create Invoice](#create-invoice)
  - [List Current User Invoices](#list-current-user-invoices)
  - [Get Invoice Details](#get-invoice-details)
  - [Add Invoice Document Placeholder](#add-invoice-document-placeholder)
  - [Submit Invoice](#submit-invoice)
  - [Advance Quote](#advance-quote)
  - [Create Advance Request](#create-advance-request)
  - [List Current User Advance Requests](#list-current-user-advance-requests)
  - [Get Advance Request Details](#get-advance-request-details)
  - [Simulate Advance Disbursement](#simulate-advance-disbursement)
  - [Simulate Freelancer Client Payment Detected](#simulate-freelancer-client-payment-detected)
  - [Simulate Freelancer User Repayment](#simulate-freelancer-user-repayment)
  - [Simulate Factoring Client Payment To Hassil](#simulate-factoring-client-payment-to-hassil)
  - [Simulate Factoring Buffer Release](#simulate-factoring-buffer-release)
  - [Get Client Confirmation](#get-client-confirmation)
  - [Confirm Client Confirmation](#confirm-client-confirmation)
  - [Dispute Client Confirmation](#dispute-client-confirmation)
  - [List Pending Admin Reviews](#list-pending-admin-reviews)
  - [Get Admin Review Detail](#get-admin-review-detail)
  - [Approve Advance Request Manually](#approve-advance-request-manually)
  - [Reject Advance Request Manually](#reject-advance-request-manually)
  - [Request More Information](#request-more-information)
  - [Generate AI Review Summary](#generate-ai-review-summary)
  - [Get Trust Score Events](#get-trust-score-events)
  - [Get Dashboard Summary](#get-dashboard-summary)
  - [List Transactions](#list-transactions)
- [Recommended Current Workflow](#recommended-current-workflow)
- [Error Response Shape](#error-response-shape)
- [Recommended Next Work](#recommended-next-work)

## Current Backend Scope

The backend currently covers the first working slice of the demo:

```text
seed demo data -> demo login -> authorize requests -> create/list/submit invoices -> quote/create advances -> confirm factoring clients -> admin review -> simulate advances -> dashboard and transaction history
```

The core MVP backend slices from the spec are now implemented. Remaining work is mostly frontend integration, richer demos, and production hardening.

## How To Use Swagger Authorization

1. Start the API and open Swagger.
2. Seed demo data:

```http
POST /api/demo/seed
```

3. Log in:

```http
POST /api/auth/demo-login
```

Example body:

```json
{
  "persona": "small_business"
}
```

4. Copy the `accessToken` from the response.
5. Click **Authorize** in Swagger.
6. Paste only the token value. Do not prefix it with `Bearer`; Swagger adds that automatically.
7. Call protected endpoints.

Accepted demo personas:

```text
small_business
freelancer
admin
```

## Implemented APIs

### Demo Seed

```http
POST /api/demo/seed
```

Seeds the database with demo records from the spec.

Creates:

- Ahmed Studio, a small business user.
- Sara Designs, a freelancer user.
- Admin Reviewer, an admin user.
- Demo clients such as Omar Hospitality Group and Noura Retail Group.
- Demo invoices.
- Demo advance requests.
- Demo transactions.
- Demo trust-score events.
- One AI review snapshot.

Use this first when preparing the demo environment.

### Demo Login

```http
POST /api/auth/demo-login
```

Logs in as a seeded demo user and returns a bearer token.

Example request:

```json
{
  "persona": "small_business"
}
```

Example response shape:

```json
{
  "accessToken": "hassil-demo-v1...",
  "expiresAt": "2026-04-29T11:50:53Z",
  "user": {
    "id": "user-id",
    "accountType": "SmallBusiness",
    "role": "User",
    "email": "finance@ahmedstudio.co",
    "trustScore": 60
  }
}
```

### Current User

```http
GET /api/users/me
```

Returns the authenticated user from the bearer token.

Requires authorization.

Use this to verify that login and Swagger authorization are working.

### Create Invoice

```http
POST /api/invoices
```

Creates a `Draft` invoice for the authenticated user.

Example request:

```json
{
  "clientName": "Noura Retail Group",
  "clientEmail": "ap@nouraretail.sa",
  "clientCountry": "Saudi Arabia",
  "invoiceNumber": "AHM-2026-020",
  "receivableSource": "DirectClientInvoice",
  "amount": 12000,
  "currency": "USD",
  "issueDate": "2026-04-29",
  "dueDate": "2026-06-10",
  "description": "Campaign assets and launch package.",
  "paymentTerms": "Net 45"
}
```

Accepted `receivableSource` values:

```text
DirectClientInvoice
FreelancePlatformPayout
```

What the endpoint does:

- Finds or creates the client by email.
- Generates an invoice fingerprint.
- Rejects exact duplicates with `409 DUPLICATE_INVOICE`.
- Saves the invoice as `Draft`.

### List Current User Invoices

```http
GET /api/invoices
```

Returns invoices owned by the authenticated user.

The response is a lightweight list intended for invoice table/list screens.

Includes:

- Invoice id.
- Invoice number.
- Client summary.
- Amount and currency.
- Due date.
- Status.
- Document count.
- Advance request id, if one exists.

### Get Invoice Details

```http
GET /api/invoices/{id}
```

Returns a full invoice detail response.

Only returns invoices owned by the authenticated user.

Includes:

- Client details.
- Invoice amount, dates, source, and status.
- Invoice fingerprint.
- Supporting documents.
- Advance request id, if one exists.

### Add Invoice Document Placeholder

```http
POST /api/invoices/{id}/documents
```

Adds a supporting document record to an invoice.

This does not upload a real file yet. It is a placeholder for demo evidence.

Example request:

```json
{
  "fileName": "signed-contract.pdf",
  "fileUrl": null,
  "documentType": "Signed Contract"
}
```

If `fileUrl` is null, the API creates a demo URL:

```text
/demo-documents/signed-contract.pdf
```

### Submit Invoice

```http
POST /api/invoices/{id}/submit
```

Moves an invoice from:

```text
Draft -> Submitted
```

Use this when the invoice is ready for advance eligibility.

The endpoint fails if the invoice is not currently in `Draft`.

### Advance Quote

```http
POST /api/advance-requests/quote
```

Calculates an advance offer for an invoice without writing a new advance request.

Example request:

```json
{
  "invoiceId": "invoice-id",
  "requestedPercent": null
}
```

If `requestedPercent` is null, the API uses the maximum allowed percent for the user's account type and trust score.

The quote returns:

- financing model: `InvoiceDiscounting` for freelancers, `InvoiceFactoring` for small businesses
- advance amount
- fee amount
- settlement buffer
- expected repayment amount
- eligibility messages

### Create Advance Request

```http
POST /api/advance-requests
```

Creates an advance request from a submitted invoice.

Example request:

```json
{
  "invoiceId": "invoice-id",
  "requestedPercent": null,
  "termsAccepted": true,
  "termsVersion": "hackathon-v1"
}
```

What it does:

- Calculates the quote.
- Scores the request using deterministic review rules.
- Stores accepted terms.
- Moves the invoice from `Submitted` to an advance-related status.
- Auto-approves strong freelancer discounting requests.
- Generates a client confirmation token for factoring requests.
- Sends factoring requests to `PendingClientConfirmation` until the client confirms or disputes.

### List Current User Advance Requests

```http
GET /api/advance-requests
```

Returns advance requests owned by the authenticated user.

### Get Advance Request Details

```http
GET /api/advance-requests/{id}
```

Returns one advance request, including invoice summary and ledger transactions.

### Simulate Advance Disbursement

```http
POST /api/advance-requests/{id}/simulate-disbursement
```

Moves an approved advance from:

```text
Approved -> Disbursed
```

Also marks the invoice as `Disbursed` and records an `AdvanceDisbursement` transaction.

### Simulate Freelancer Client Payment Detected

```http
POST /api/advance-requests/{id}/simulate-client-payment-detected
```

For freelancer discounting only.

Moves the advance from:

```text
Disbursed -> ClientPaymentDetected
```

Records a `DetectedIncomingPayment` transaction.

### Simulate Freelancer User Repayment

```http
POST /api/advance-requests/{id}/simulate-user-repayment
```

For freelancer discounting only.

Moves the advance from:

```text
ClientPaymentDetected -> Repaid
```

Also marks the invoice as `Paid`, records repayment and fee transactions, and increases trust score.

### Simulate Factoring Client Payment To Hassil

```http
POST /api/advance-requests/{id}/simulate-client-payment-to-hassil
```

For small business factoring only.

Moves the advance from:

```text
Disbursed -> ClientPaidHassil
```

Records a `ClientPaymentToHassil` transaction.

### Simulate Factoring Buffer Release

```http
POST /api/advance-requests/{id}/simulate-buffer-release
```

For small business factoring only.

Moves the advance through settlement completion:

```text
ClientPaidHassil -> BufferReleased -> Repaid
```

Also marks the invoice as `Paid`, records platform fee and buffer release transactions, and increases trust score.

### Get Client Confirmation

```http
GET /api/client-confirmations/{token}
```

Public endpoint. It does not require bearer authorization.

Returns the invoice and advance request linked to a client confirmation token.

The token is generated when a small business factoring advance request is created.

### Confirm Client Confirmation

```http
POST /api/client-confirmations/{token}/confirm
```

Public endpoint. It confirms the invoice and payment redirection.

Example request:

```json
{
  "note": "Work received and approved."
}
```

What it does:

- Moves the confirmation from `Pending` to `Confirmed`.
- Moves the invoice from `PendingClientConfirmation` to review.
- Moves the advance from `PendingClientConfirmation` to `PendingReview`.
- Re-scores the request.
- Auto-approves strong requests.
- Increases trust score for client confirmation.

### Dispute Client Confirmation

```http
POST /api/client-confirmations/{token}/dispute
```

Public endpoint. It lets the client dispute the invoice.

Example request:

```json
{
  "note": "The delivered work does not match the approved scope."
}
```

What it does:

- Moves the confirmation to `Disputed`.
- Moves the invoice to `Disputed`.
- Rejects the linked advance request.
- Reduces trust score for the dispute.

### List Pending Admin Reviews

```http
GET /api/admin/advance-requests/pending
```

Admin-only endpoint.

Returns advance requests in `PendingReview`.

Use the `admin` persona token in Swagger for this endpoint.

### Get Admin Review Detail

```http
GET /api/admin/advance-requests/{id}
```

Admin-only endpoint.

Returns:

- the full advance request response
- verification checklist
- latest AI review snapshot, if one exists
- admin review history

The checklist covers the simple MVP checks from the spec: active user, accepted terms, attached evidence, due-date window, trust-based limit, trust score, and client confirmation when factoring is used.

### Approve Advance Request Manually

```http
POST /api/admin/advance-requests/{id}/approve
```

Admin-only endpoint.

Example request:

```json
{
  "notes": "Evidence checked and approved."
}
```

Moves the advance from:

```text
PendingReview -> Approved
```

Also marks the linked invoice as `Approved` and writes an `AdminReview` record.

### Reject Advance Request Manually

```http
POST /api/admin/advance-requests/{id}/reject
```

Admin-only endpoint.

Example request:

```json
{
  "reason": "Supporting evidence does not match the invoice."
}
```

Moves the advance to `Rejected`, marks the linked invoice as `Rejected`, writes an `AdminReview` record, and reduces trust score.

### Request More Information

```http
POST /api/admin/advance-requests/{id}/request-more-info
```

Admin-only endpoint.

Example request:

```json
{
  "notes": "Please attach the signed purchase order."
}
```

Writes an `AdminReview` record with decision `RequestMoreInfo`.

The request remains in `PendingReview`; this keeps the demo flow simple until a real evidence request workflow exists.

### Generate AI Review Summary

```http
POST /api/admin/advance-requests/{id}/ai-review
```

Admin-only endpoint.

Creates a new `AiReviewSnapshot` using the rule-backed MVP assistant.

The assistant does not make the final decision. It summarizes the request risk and recommends one of:

```text
Approve
ManualReview
Reject
```

### Get Trust Score Events

```http
GET /api/trust-score/events
```

Returns the authenticated user's current trust score and score-change history.

Example response shape:

```json
{
  "currentScore": 60,
  "events": [
    {
      "id": "event-id",
      "oldScore": 55,
      "newScore": 60,
      "delta": 5,
      "reason": "Client confirmed factoring invoice.",
      "createdAt": "2026-04-30T10:00:00Z"
    }
  ]
}
```

Events are ordered newest first.

Trust score events are created by other flows, such as:

- demo seeding baseline score setup
- client confirmation
- client dispute
- repayment completion
- admin rejection

### Get Dashboard Summary

```http
GET /api/dashboard/summary
```

Returns a current-user dashboard summary.

The response includes:

- account type and financing model
- current trust score
- ledger balance from recorded credit/debit transactions
- outstanding invoice count and amount
- active advance count and amount
- expected repayment count and amount
- review-state counters
- five latest transactions

Example response shape:

```json
{
  "accountType": "SmallBusiness",
  "financingModel": "InvoiceFactoring",
  "trustScore": 60,
  "ledgerBalance": 19600,
  "outstandingInvoices": {
    "count": 1,
    "amount": 18000
  },
  "activeAdvances": {
    "count": 1,
    "amount": 16200
  },
  "expectedRepayments": {
    "count": 1,
    "amount": 18000
  },
  "reviewStates": {
    "pendingClientConfirmation": 0,
    "pendingReview": 1,
    "approvedReadyForDisbursement": 0
  },
  "recentTransactions": []
}
```

### List Transactions

```http
GET /api/transactions
```

Returns the authenticated user's ledger transactions, newest first.

Optional query:

```http
GET /api/transactions?limit=50
```

`limit` is clamped between `1` and `500`.

Each transaction includes:

- transaction id
- invoice id and invoice number, if linked
- advance request id, if linked
- type
- direction
- amount
- description
- created date

## Recommended Current Workflow

```text
1. POST /api/demo/seed
2. POST /api/auth/demo-login
3. Authorize Swagger with the returned accessToken
4. GET /api/users/me
5. POST /api/invoices
6. POST /api/invoices/{id}/documents
7. POST /api/invoices/{id}/submit
8. POST /api/advance-requests/quote
9. POST /api/advance-requests
10. For factoring: GET /api/client-confirmations/{token}
11. For factoring: POST /api/client-confirmations/{token}/confirm
12. GET /api/advance-requests
13. GET /api/advance-requests/{id}
14. For manual review: log in as `admin`
15. GET /api/admin/advance-requests/pending
16. GET /api/admin/advance-requests/{id}
17. POST /api/admin/advance-requests/{id}/ai-review
18. POST /api/admin/advance-requests/{id}/approve
19. GET /api/trust-score/events
20. GET /api/dashboard/summary
21. GET /api/transactions
```

## Error Response Shape

Expected application errors return a consistent JSON response:

```json
{
  "error": "Invoice not found.",
  "code": "INVOICE_NOT_FOUND",
  "details": null,
  "traceId": "request-trace-id"
}
```

Common error codes so far:

| Code | Meaning |
|---|---|
| `INVALID_DEMO_PERSONA` | The demo login persona is not supported. |
| `DEMO_USER_NOT_FOUND` | Demo data has not been seeded, or the demo user is missing. |
| `USER_NOT_FOUND` | The authenticated user no longer exists. |
| `INVALID_RECEIVABLE_SOURCE` | Invoice source is not `DirectClientInvoice` or `FreelancePlatformPayout`. |
| `DUPLICATE_INVOICE` | An invoice with the same fingerprint already exists. |
| `INVOICE_NOT_FOUND` | The invoice does not exist or does not belong to the current user. |
| `INVALID_INVOICE_TRANSITION` | The requested status transition is not allowed. |
| `ADVANCE_NOT_ELIGIBLE` | The invoice failed quote eligibility checks. |
| `ADVANCE_ALREADY_EXISTS` | The invoice already has an advance request. |
| `ADVANCE_REQUEST_NOT_FOUND` | The advance request does not exist or does not belong to the current user. |
| `INVALID_ADVANCE_TRANSITION` | The requested advance status transition is not allowed. |
| `INVALID_FINANCING_MODEL` | A simulation was called for the wrong financing model. |
| `CLIENT_CONFIRMATION_NOT_FOUND` | The client confirmation token was not found. |
| `INVALID_CLIENT_CONFIRMATION_TRANSITION` | The confirmation cannot move to the requested state. |
| `REVIEWER_NOT_FOUND` | The admin reviewer user from the token was not found. |
| `ADMIN_ROLE_REQUIRED` | The current user is not an admin reviewer. |
| `REJECTION_REASON_REQUIRED` | Manual rejection was submitted without a reason. |
| `INVALID_ADMIN_REVIEW_TRANSITION` | The manual review action is not valid for the current advance/invoice state. |

## Recommended Next Work

The core MVP backend API is covered. Next work should be:

- connect the frontend screens to these endpoints
- add realistic file upload/storage for invoice documents
- add endpoint-level smoke tests for the demo workflow
- polish demo seed data for the exact presentation story
