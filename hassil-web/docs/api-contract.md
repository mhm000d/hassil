# Hassil Web API Contract

This file documents the mocked frontend API contract for the Hassil demo app.

## Authentication and demo setup

| Method | Endpoint               | Purpose                                                       |
| ------ | ---------------------- | ------------------------------------------------------------- |
| POST   | `/api/auth/demo-login` | Log in as a seeded small business, freelancer, or admin user. |
| POST   | `/api/demo/seed`       | Seed demo data for the hackathon presentation.                |

## Onboarding

| Method | Endpoint                         | Purpose                                                       |
| ------ | -------------------------------- | ------------------------------------------------------------- |
| POST   | `/api/onboarding/small-business` | Create a new small business profile for factoring.            |
| POST   | `/api/onboarding/freelancer`     | Create a new freelancer profile for discounting.              |
| GET    | `/api/users/me`                  | Retrieve current user profile, account type, and trust score. |

## Invoices

| Method | Endpoint                       | Purpose                                            |
| ------ | ------------------------------ | -------------------------------------------------- |
| POST   | `/api/invoices`                | Create a new invoice.                              |
| GET    | `/api/invoices`                | List invoices for the current user.                |
| GET    | `/api/invoices/{id}`           | Get details for a specific invoice.                |
| POST   | `/api/invoices/{id}/documents` | Upload a supporting document placeholder.          |
| POST   | `/api/invoices/{id}/submit`    | Submit invoice for advance review and eligibility. |

## Advance requests

| Method | Endpoint                                                       | Purpose                                                     |
| ------ | -------------------------------------------------------------- | ----------------------------------------------------------- |
| POST   | `/api/advance-requests/quote`                                  | Calculate advance quote, fee, buffer, and repayment amount. |
| POST   | `/api/advance-requests`                                        | Create an advance request with accepted terms.              |
| GET    | `/api/advance-requests`                                        | List advance requests for the current user.                 |
| GET    | `/api/advance-requests/{id}`                                   | Retrieve advance request details.                           |
| POST   | `/api/advance-requests/{id}/simulate-disbursement`             | Simulate advance disbursement.                              |
| POST   | `/api/advance-requests/{id}/simulate-client-payment-detected`  | Simulate client payment detection for discounting.          |
| POST   | `/api/advance-requests/{id}/simulate-user-repayment`           | Simulate freelancer repayment to Hassil.                    |
| POST   | `/api/advance-requests/{id}/simulate-client-payment-to-hassil` | Simulate factoring client payment to Hassil.                |
| POST   | `/api/advance-requests/{id}/simulate-buffer-release`           | Simulate settlement buffer release to the business.         |

## Client confirmation

| Method | Endpoint                                    | Purpose                                            |
| ------ | ------------------------------------------- | -------------------------------------------------- |
| GET    | `/api/client-confirmations/{token}`         | Retrieve public client confirmation details.       |
| POST   | `/api/client-confirmations/{token}/confirm` | Confirm an invoice and redirect payment to Hassil. |
| POST   | `/api/client-confirmations/{token}/dispute` | Dispute the invoice as a client.                   |

## Admin review

| Method | Endpoint                                             | Purpose                                                    |
| ------ | ---------------------------------------------------- | ---------------------------------------------------------- |
| GET    | `/api/admin/advance-requests/pending`                | List pending manual review requests.                       |
| GET    | `/api/admin/advance-requests/{id}`                   | View review flags, AI summary, and verification checklist. |
| POST   | `/api/admin/advance-requests/{id}/approve`           | Approve the advance request manually.                      |
| POST   | `/api/admin/advance-requests/{id}/reject`            | Reject the advance request with a reason.                  |
| POST   | `/api/admin/advance-requests/{id}/request-more-info` | Mark the request as needing more information.              |
| POST   | `/api/admin/advance-requests/{id}/ai-review`         | Generate or refresh the AI review summary.                 |

## Notes

- This API contract is mocked in the frontend demo and serves as the reference for request body and response shapes.
- Endpoints are intended to mimic the backend behavior described in the product spec.
