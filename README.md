# Hassil

Hassil helps freelancers and small businesses unlock cash flow from confirmed invoices and completed work before delayed payments arrive.

## Table Of Contents

- [How Users Interact With Hassil](#how-users-interact-with-hassil)
- [Example 1: SME Factoring From Invoice To Settlement](#example-1-sme-factoring-from-invoice-to-settlement)
- [Example 2: Freelancer Discounting Without Client Notification](#example-2-freelancer-discounting-without-client-notification)
- [Example 3: Admin Review For Risky Requests](#example-3-admin-review-for-risky-requests)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Documentation Map](#documentation-map)
- [Prototype Pages And Routes](#prototype-pages-and-routes)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Run The Backend](#run-the-backend)
- [Run The Frontend](#run-the-frontend)
- [Run The Prototype](#run-the-prototype)
- [Run Local PostgreSQL](#run-local-postgresql)
- [Notes](#notes)

## How Users Interact With Hassil

Hassil supports two related invoice-finance journeys:

- **SME invoice factoring:** the business asks for an advance, the client confirms the invoice, the client pays Hassil, and Hassil releases the remaining settlement balance.
- **Freelancer invoice discounting:** the freelancer asks for an advance privately, the client or platform pays the freelancer as usual, and the freelancer repays Hassil after payment arrives.

### Example 1: SME Factoring From Invoice To Settlement

Ahmed Studio finishes a campaign package for Noura Retail Group and uploads the invoice to Hassil.

1. Ahmed opens the dashboard and creates invoice `AHM-2026-018`.
2. Hassil checks the invoice amount, due date, duplicate fingerprint, and supporting evidence.
3. Ahmed reviews the quote: advance amount, fixed fee, expected repayment path, and settlement buffer.
4. Because Ahmed is an SME, Hassil uses the factoring model. Noura receives a client confirmation link.
5. Noura confirms the invoice and agrees to pay Hassil on the due date.
6. Hassil approves or routes the request to admin review, then disburses the advance to Ahmed.
7. When Noura pays Hassil, Hassil records the payment, collects the fixed fee, and releases the remaining buffer to Ahmed.
8. The ledger and trust score update so future limits can improve.

In the prototype, use the **Ahmed Studio** profile, open an SME invoice, request an advance, open the client link, confirm it, then continue the advance lifecycle.

### Example 2: Freelancer Discounting Without Client Notification

Sara Designs completes a landing page project and expects payment from a client or marketplace after a payout delay.

1. Sara opens Hassil and creates or opens invoice `SAR-2026-027`.
2. Hassil checks the invoice, evidence, due date, amount limit, and duplicate fingerprint.
3. Sara reviews a discounting quote with the advance amount and fixed fee.
4. The client is not notified. Sara accepts the terms and submits the request.
5. Hassil auto-approves strong requests or sends lower-score requests to admin review.
6. Hassil disburses the advance to Sara.
7. When the client or platform payment arrives in Sara's account, Hassil records the detected payment.
8. Sara repays the advance plus the fixed fee, and the ledger/trust score update.

In the prototype, switch to **Sara Designs**, open a freelancer invoice, request an advance, then use the advance detail lifecycle controls to simulate funding, payment detection, and repayment.

### Example 3: Admin Review For Risky Requests

Some requests need a reviewer before funding.

1. Admin opens the review queue.
2. Hassil shows pending, low-score, rejected, factoring, and discounting filters.
3. The reviewer checks required items: evidence, confirmation status, score, flags, and AI summary.
4. The reviewer approves, rejects, or requests more information.
5. The invoice and advance status update immediately, and the user can continue or resolve the issue.

In the prototype, switch to **Hassil Admin**, open **Admin**, filter the queue, and review Sara's pending request.

## Tech Stack

- Backend: ASP.NET Core Web API on .NET 10
- Frontend: React, TypeScript, and Vite
- Local services: PostgreSQL through Docker Compose

## Project Structure

```text
.
|-- Docs/
|   |-- spec_1_hassil_cash_flow_brief.md       # Short product/API/spec summary
|   |-- spec_1_hassil_cash_flow_in_detail.md   # Detailed product, algorithm, API, and page spec
|   |-- final_demo_template_slides.md          # Demo presentation outline
|   `-- hassil-prototype/                      # Current front-end-only clickable prototype
|       |-- src/App.tsx                        # Prototype screens, state, and simulated flows
|       |-- src/seed.ts                        # Seeded users, invoices, advances, edge cases
|       |-- src/utils.ts                       # Quote, score, status, and formatting helpers
|       |-- src/index.css                      # Prototype UI system
|       |-- package.json                       # Prototype scripts and dependencies
|       `-- README.md                          # Prototype-specific demo guide
|-- Hassil.Api/                                # ASP.NET Core backend API project
|   |-- Program.cs                             # API entry point and endpoint registration
|   |-- Hassil.Api.csproj                      # Backend project file
|   |-- Hassil.Api.http                        # Sample API requests
|   |-- appsettings.json                       # Backend settings
|   `-- Properties/launchSettings.json         # Local backend URLs and profiles
|-- hassil-web/                                # Main React frontend app scaffold
|   |-- public/                                # Static assets
|   |-- src/                                   # Frontend source code
|   |-- package.json                           # Frontend scripts and dependencies
|   `-- vite.config.ts                         # Vite configuration
|-- compose.yaml                               # Local PostgreSQL container
|-- .env.example                               # Example environment variables
|-- Hassil.sln                                 # .NET solution
`-- README.md                                  # This project guide
```

## Documentation Map

- `Docs/spec_1_hassil_cash_flow_brief.md` summarizes routes, API contracts, services, and demo acceptance criteria.
- `Docs/spec_1_hassil_cash_flow_in_detail.md` explains the product model, invoice fingerprinting, quote calculation, review scoring, trust score rules, frontend pages, backend service structure, and seeded demo data.
- `Docs/hassil-prototype/` contains the clickable React prototype used to demonstrate the user journeys before the production frontend/backend are fully connected.

## Prototype Pages And Routes

The clickable prototype uses hash routes under `Docs/hassil-prototype`.

| Route | Page |
|---|---|
| `#/` | Landing page |
| `#/select-type` | Account type selection |
| `#/onboarding/SmallBusiness` | SME onboarding |
| `#/onboarding/Freelancer` | Freelancer onboarding |
| `#/dashboard` | Dashboard |
| `#/invoices` | Invoice list |
| `#/invoices/new` | Create invoice |
| `#/invoices/:invoiceId` | Invoice detail |
| `#/invoices/:invoiceId/advance` | Advance quote |
| `#/advances/:advanceId` | Advance detail and lifecycle |
| `#/client/confirm/:token` | Client confirmation |
| `#/admin` | Admin review queue |
| `#/admin/advances/:advanceId` | Admin review detail |
| `#/ledger` | Ledger and trust history |
| `#/cash-flow` | Cash-flow forecast |

## Prerequisites

- [.NET SDK 10](https://dotnet.microsoft.com/)
- [Node.js](https://nodejs.org/) with npm
- Docker, if you want to run the local PostgreSQL service

This project was checked with .NET `10.0.102`, Node `v22.15.0`, and npm `10.9.2`.

## Environment Setup

Create a local `.env` file from the example when using Docker Compose:

```bash
cp .env.example .env
```

Fill in the PostgreSQL values:

```env
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
```

## Run The Backend

From the repository root:

```bash
dotnet restore Hassil.sln
dotnet run --project Hassil.Api --launch-profile http
```

The API runs at:

- `http://localhost:5229`

## Run The Frontend

From the frontend directory:

```bash
cd hassil-web
npm install
npm run dev
```

Vite will print the local frontend URL, usually:

- `http://localhost:5173`

## Run The Prototype

The current interactive demo lives under `Docs/hassil-prototype`.

```bash
cd Docs/hassil-prototype
npm install
npm run dev
```

Open the Vite URL printed in the terminal. The prototype includes seeded SME, freelancer, admin, expired-link, disputed-invoice, and approved-not-funded states.

## Run Local PostgreSQL

After creating `.env`, start the database container from the repository root:

```bash
docker compose up -d
```

PostgreSQL is exposed locally on port `5432`.

Stop it with:

```bash
docker compose down
```

## Notes

- The backend is currently a starter API with a sample weather endpoint and OpenAPI output enabled in Development.
- The frontend is currently a Vite React starter app and is ready for the Hassil product UI to be built.
- The prototype is front-end-only and simulates backend behavior in React state.
- Keep real secrets in `.env` only. Use `.env.example` for placeholder values that are safe to commit.
