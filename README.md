<div align="center">
  <h1>Hassil 💰</h1>
  <p><strong>Unlock Cash Flow from Confirmed Invoices and Completed Work</strong></p>

  [![.NET 10](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white)](#)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](#)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](#)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#)
</div>

---

Hassil helps freelancers and small businesses (SMEs) bridge the gap between completed work and delayed payments. By providing immediate advances on confirmed invoices, Hassil ensures that businesses have the liquidity they need to grow without waiting 30, 60, or 90 days for client payouts.

## ✨ Key Features

- **SME Invoice Factoring**: Secure an advance, notify the client for confirmation, and have the client pay Hassil directly upon the due date.
- **Freelancer Invoice Discounting**: Keep client relationships private. Receive an advance securely and repay Hassil after your client or marketplace pays you.
- **Dynamic Cash Flow Forecasting**: Visualize upcoming receivables, outstanding advances, and due payments in a live dashboard.
- **Automated Trust Scoring**: Built-in algorithms adjust trust scores and limits based on repayment history.
- **Admin Review Queue**: Powerful admin tools to review risky requests, check evidence, and approve or reject funding.

## 🛠 Tech Stack

- **Backend**: ASP.NET Core Web API (.NET 10), Entity Framework Core
- **Database**: PostgreSQL (containerized via Docker Compose)
- **Frontend**: React, TypeScript, Vite

## 🚀 Getting Started

### Prerequisites
- [.NET SDK 10](https://dotnet.microsoft.com/)
- [Node.js](https://nodejs.org/) (v22+) and npm
- Docker (for local PostgreSQL database)

### 1. Environment Setup

Create a local `.env` file from the example for Docker Compose:

```bash
cp .env.example .env
```

Fill in the PostgreSQL credentials inside `.env`:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=hassil
```

### 2. Start the Database

Spin up the local PostgreSQL container (runs on port `5432`):
```bash
docker compose up -d
```

### 3. Run the Backend (API)

Navigate to the repository root and start the ASP.NET Core API:
```bash
dotnet restore Hassil.sln
dotnet run --project Hassil.Api --launch-profile http
```
*The API will run locally at `http://localhost:5229`.*

### 4. Run the Frontend (React SPA)

Open a new terminal, navigate to the frontend directory, and start Vite:
```bash
cd hassil-web
npm install
npm run dev
```
*The React app will be available at `http://localhost:5173`.*

## 📖 Core Workflows

Hassil handles two primary financing models seamlessly:

### 🏢 SME Factoring (Transparent)
1. **Request**: An SME creates an invoice and requests an advance.
2. **Confirmation**: Hassil sends a secure confirmation link to the SME's client.
3. **Funding**: Once the client confirms the invoice, Hassil disburses the advance to the SME.
4. **Settlement**: The client pays Hassil on the due date. Hassil deducts the fixed fee and releases the remaining buffer to the SME.

### 💻 Freelancer Discounting (Private)
1. **Request**: A freelancer requests an advance against a marketplace payout or private client.
2. **Funding**: Hassil reviews the trust score and disburses the advance immediately.
3. **Repayment**: The freelancer receives the original payment from their client, and subsequently repays Hassil the advance plus a fixed fee.

## 📂 Project Structure

```text
.
|-- Docs/
|   |-- spec_1_hassil_cash_flow_brief.md       # Short product/API/spec summary
|   `-- spec_1_hassil_cash_flow_in_detail.md   # Detailed product, algorithm, API, and page spec
|-- Hassil.Api/                                # ASP.NET Core 10 backend API project
|   |-- Controllers/                           # API endpoints
|   |-- Domain/                                # Business entities and rules
|   |-- Database/                              # Entity Framework Core setup
|   `-- Services/                              # Core logic (invoices, advances, scoring)
|-- hassil-web/                                # React frontend SPA
|   |-- src/pages/                             # Main UI views (Dashboard, Cash Flow, etc.)
|   |-- src/components/                        # Reusable React components
|   |-- src/hooks/                             # Custom state and API hooks
|   `-- src/services/                          # API client integrations
|-- compose.yaml                               # Local PostgreSQL container
|-- .env.example                               # Example environment variables
```
**Note!** You can access the admin dashboard/review via `/login/admin` URL

app URL: https://hassil-cash.vercel.app/

## 🤝 Contributing

We welcome contributions! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
