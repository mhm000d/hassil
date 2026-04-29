# Hassil Backend API Progress

This document explains what the backend currently supports, how the existing endpoints should be used, and the recommended order for building the remaining features.

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
- [Recommended Current Workflow](#recommended-current-workflow)
- [Error Response Shape](#error-response-shape)
- [Recommended Order For Remaining Features](#recommended-order-for-remaining-features)
  - [1. Advance Quote](#1-advance-quote)
  - [2. Create Advance Request](#2-create-advance-request)
  - [3. Review Scoring](#3-review-scoring)
  - [4. Client Confirmation](#4-client-confirmation)
  - [5. Admin Review](#5-admin-review)
  - [6. Simulated Money Movement](#6-simulated-money-movement)
  - [7. Trust Score Events](#7-trust-score-events)
  - [8. Dashboard And Transactions](#8-dashboard-and-transactions)

## Current Backend Scope

The backend currently covers the first working slice of the demo:

```text
seed demo data -> demo login -> authorize requests -> create/list/submit invoices
```

It does not yet include advance requests, client confirmation, admin review, simulated payments, trust-score event listing, dashboard summaries, or transaction listing.

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

## Recommended Current Workflow

```text
1. POST /api/demo/seed
2. POST /api/auth/demo-login
3. Authorize Swagger with the returned accessToken
4. GET /api/users/me
5. POST /api/invoices
6. POST /api/invoices/{id}/documents
7. POST /api/invoices/{id}/submit
8. GET /api/invoices
9. GET /api/invoices/{id}
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

## Recommended Order For Remaining Features

Build one vertical slice at a time.

### 1. Advance Quote

```http
POST /api/advance-requests/quote
```

Build first because users need to see the offer before accepting it.

Add:

- `AdvanceCalculatorService`
- quote request/response contracts
- quote endpoint

No database write is needed yet.

### 2. Create Advance Request

```http
POST /api/advance-requests
```

Persist the accepted quote.

Add:

- `AdvanceRequestsController`
- `AdvanceRequestService`
- invoice status transition to `AdvanceRequested`
- terms acceptance

### 3. Review Scoring

Add review scoring inside advance creation.

Add:

- `ReviewScoringService`
- checks for documents, duplicate risk, trust score, amount limits, and due date
- status decision such as `Approved`, `PendingReview`, or `PendingClientConfirmation`

### 4. Client Confirmation

```http
GET  /api/client-confirmations/{token}
POST /api/client-confirmations/{token}/confirm
POST /api/client-confirmations/{token}/dispute
```

Needed for small business factoring.

Add:

- `MockNotificationService`
- confirmation token creation
- public confirmation endpoints

### 5. Admin Review

```http
GET  /api/admin/advance-requests/pending
GET  /api/admin/advance-requests/{id}
POST /api/admin/advance-requests/{id}/approve
POST /api/admin/advance-requests/{id}/reject
POST /api/admin/advance-requests/{id}/request-more-info
POST /api/admin/advance-requests/{id}/ai-review
```

Build this after scoring creates pending review records.

Add:

- admin-only authorization checks
- `AiReviewService`
- `AdminReview` records
- manual approve/reject flow

### 6. Simulated Money Movement

```http
POST /api/advance-requests/{id}/simulate-disbursement
POST /api/advance-requests/{id}/simulate-client-payment-detected
POST /api/advance-requests/{id}/simulate-user-repayment
POST /api/advance-requests/{id}/simulate-client-payment-to-hassil
POST /api/advance-requests/{id}/simulate-buffer-release
```

Build after approval exists.

Add:

- `LedgerService`
- `MockOpenBankingGateway`
- transaction creation
- advance and invoice status transitions

### 7. Trust Score Events

```http
GET /api/trust-score/events
```

Build after repayment flows update trust score.

Add:

- `TrustScoreService`
- score updates after successful repayment or buffer release
- trust-score history endpoint

### 8. Dashboard And Transactions

```http
GET /api/dashboard/summary
GET /api/transactions
```

Build last because dashboard data depends on invoices, advances, payments, transactions, and trust score.

Add:

- dashboard summary service
- transaction history endpoint
- summary cards for open invoices, active advances, recent transactions, and trust score
