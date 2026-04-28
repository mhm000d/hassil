# Hassil

Hassil helps freelancers and small businesses unlock cash flow from confirmed invoices and completed work before delayed payments arrive.

## Tech Stack

- Backend: ASP.NET Core Web API on .NET 10
- Frontend: React, TypeScript, and Vite
- Local services: PostgreSQL through Docker Compose

## Project Structure

```text
.
|-- Docs/                         # Product specs and planning documents
|-- Hassil.Api/                   # ASP.NET Core backend API
|   |-- Program.cs                # API entry point and endpoint registration
|   |-- Hassil.Api.csproj         # Backend project file
|   |-- Hassil.Api.http           # Sample API requests
|   `-- Properties/
|       `-- launchSettings.json   # Local backend URLs and profiles
|-- hassil-web/                   # React frontend
|   |-- public/                   # Static assets
|   |-- src/                      # Frontend source code
|   |-- package.json              # Frontend scripts and dependencies
|   `-- vite.config.ts            # Vite configuration
|-- compose.yaml                  # Local PostgreSQL container
|-- .env.example                  # Example environment variables
|-- Hassil.sln                    # .NET solution
`-- README.md
```

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
- Keep real secrets in `.env` only. Use `.env.example` for placeholder values that are safe to commit.
