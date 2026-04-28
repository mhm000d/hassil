# Hassil Prototype

A Vite + React + TypeScript demo prototype for Hassil, a cash-flow management and invoice advance platform for freelancers and small businesses.

## Latest UI direction

This version uses the clean light structure and teal palette from the provided reference component:

- Light background: `#f9faf8`
- Primary teal: `#1a9e7a`
- Soft teal surfaces: `#e8f7f3` and `#d0f0e8`
- Neutral borders: `#e5e7eb`
- Red/amber states for dispute, rejection, overdue, and review warnings
- Sticky top navigation with pill tabs, demo identity switcher, trust score, and quick actions

## What this prototype includes

- Landing page with two financing models.
- Account type selection and separate onboarding forms for small businesses and freelancers.
- Seeded profiles: Ahmed Studio, Sara Designs, Laila UX, and Hassil Admin.
- Dashboard with invoices, active advances, balance, trust score, and ledger activity.
- Invoice creation with duplicate checks, due-date validation, and mock evidence upload.
- Advance quote screen with advance amount, fixed fee, repayment amount, and settlement buffer.
- Freelancer invoice discounting flow with no client notification.
- Small business invoice factoring flow with client confirmation and payment redirection.
- Public client confirmation pages for pending, confirmed, disputed, and expired links.
- Admin review console with filters, review flags, recommended action, and AI summary.
- Lifecycle stepper for funding, payment detection, repayment, client payment, and settlement.
- Ledger, trust score breakdown, and cash-flow forecast chart.
- Hash routes such as `#/invoices/:id`, `#/advances/:id`, and `#/admin/advances/:id`.

## End-to-end examples

### SME: Ahmed Studio uses invoice factoring

Ahmed Studio has delivered campaign assets to Noura Retail Group and wants cash before the invoice due date.

1. Switch the profile to **Ahmed Studio**.
2. Open an existing SME invoice or create a new direct client invoice.
3. Add or review supporting evidence such as a purchase order or delivery proof.
4. Request an advance and review the quote: advance amount, fixed fee, repayment party, and settlement buffer.
5. Open the generated client confirmation link.
6. Confirm the invoice as the client.
7. Return to the advance detail page and continue the lifecycle: approve/fund, client pays Hassil, fee is collected, buffer is released.
8. Open the ledger to see the advance, client payment, fee, buffer release, and trust score changes.

This demonstrates the factoring model: the client is involved, pays Hassil directly, and the SME receives the remaining balance after settlement.

### Freelancer: Sara Designs uses invoice discounting

Sara Designs has completed design work and expects a client or marketplace payment later.

1. Switch the profile to **Sara Designs**.
2. Open a freelancer invoice or create a new receivable.
3. Review evidence, duplicate checks, due-date checks, and the quote.
4. Submit the advance request. The client is not notified.
5. If the request is approved, open the advance detail page.
6. Simulate funding, then simulate client/platform payment detection.
7. Simulate user repayment.
8. Check the ledger and trust score breakdown.

This demonstrates discounting: the freelancer keeps the client relationship unchanged and repays Hassil after receiving payment.

### Admin: reviewer handles a risky request

1. Switch the profile to **Hassil Admin**.
2. Open **Admin** from the top navigation.
3. Use filters such as **Pending review**, **Awaiting client**, **Rejected**, **Low score**, **Factoring**, or **Discounting**.
4. Open a request.
5. Review the score, required checks, evidence count, confirmation state, flags, and AI summary.
6. Approve, reject, or request more information.

This demonstrates that AI is only a review aid. The admin action controls the final state.

## Project structure

```text
Docs/hassil-prototype/
|-- src/
|   |-- App.tsx          # Screens, routing, state transitions, simulated workflows
|   |-- seed.ts          # Seeded users, clients, invoices, advances, transactions, edge cases
|   |-- utils.ts         # Quote calculation, review scoring, labels, formatting
|   |-- types.ts         # Shared TypeScript domain types
|   |-- index.css        # UI system, responsive layout, mobile table behavior
|   `-- main.tsx         # React entry point
|-- index.html           # Vite HTML entry
|-- package.json         # Prototype scripts and dependencies
|-- vite.config.ts       # Vite configuration
`-- README.md            # This prototype guide
```

Related project folders:

```text
../../Hassil.Api/       # ASP.NET Core backend API project
../../hassil-web/       # Main React frontend app scaffold
../*.md                 # Product specs, API contracts, backend/frontend structure, demo docs
```

## Prototype pages and routes

The prototype uses hash routes so it can run as a static Vite app without a backend router.

| Route | Page | Purpose |
|---|---|---|
| `#/` | Landing page | Product entry page with workspace preview and financing models. |
| `#/select-type` | Account type selection | Choose SME factoring or freelancer discounting. |
| `#/onboarding/SmallBusiness` | SME onboarding | Create a small business profile. |
| `#/onboarding/Freelancer` | Freelancer onboarding | Create a freelancer profile. |
| `#/dashboard` | Dashboard | View invoices, active advances, balance, trust score, and next action. |
| `#/invoices` | Invoice list | Browse invoice portfolio and request advances. |
| `#/invoices/new` | Create invoice | Enter invoice details, validate inputs, and attach mock evidence. |
| `#/invoices/:invoiceId` | Invoice detail | Review invoice details, evidence, checks, and advance readiness. |
| `#/invoices/:invoiceId/advance` | Advance quote | Review advance amount, fixed fee, repayment path, and review score. |
| `#/advances/:advanceId` | Advance detail | Track lifecycle from approval to funding, repayment, and settlement. |
| `#/client/confirm/:token` | Client confirmation | Public client page for factoring confirmation, dispute, expired, or completed states. |
| `#/admin` | Admin review queue | Filter pending, flagged, rejected, factoring, and discounting requests. |
| `#/admin/advances/:advanceId` | Admin review detail | Review signals, required checks, AI summary, and final decision actions. |
| `#/ledger` | Ledger and trust history | View transaction timeline and trust score breakdown. |
| `#/cash-flow` | Cash-flow forecast | View receivables, available advance, estimated fees, and weekly cash chart. |

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in your terminal, usually:

```text
http://localhost:5173
```

## Suggested demo path

1. Open the prototype.
2. Use the compact profile switcher to move between Ahmed Studio, Sara Designs, Laila UX, and Hassil Admin.
3. Create or open an invoice.
4. Add mock evidence if needed.
5. Request an advance.
6. For SME factoring, open the client confirmation link and confirm or dispute the invoice.
7. For freelancer discounting, continue directly to funding and repayment.
8. Open Ledger and Cash Flow to show money movement, trust-score impact, and forecasted receivables.
9. Open Admin Review to show filtered review queues and reviewer-controlled decisions.

## Notes

This is a front-end-only hackathon prototype. It simulates backend behavior in React state and does not move real money, integrate with real banks, perform real KYC/AML, or train an AI model.
