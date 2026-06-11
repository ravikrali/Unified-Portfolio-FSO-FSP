# Clinical Portfolio Management Solutions Prototype

Local full-stack prototype for a CRO hybrid FSO/FSP portfolio management application.

## Stack

- React + Vite frontend
- Express API
- File-backed SQLite database through `sql.js`
- Recharts for dashboard charts
- Lucide icons
- Direct `.xlsx` export writer using `fflate`

## Run Locally

```powershell
cd "C:\Users\PC3\OneDrive\01Projects\CRO Apps\rr-portfolio-management"
npm.cmd install
npm.cmd run dev
```

Open:

```text
http://127.0.0.1:5173/
```

API:

```text
http://127.0.0.1:4317/api/health
```

## Current Prototype Coverage

- Clinical Portfolio Management Solutions landing page
- Light/dark mode
- Local sign-in mock backed by API
- Post-sign-in home
- Database-seeded mock portfolio
- Portfolio health dashboard with KPI metrics, notifications, tasks, global AI search, and process-zone navigation
- Seven process-zone dashboards
- KPI-level comment and assignment dialog
- Local email outbox for assignment notifications
- Consolidated report
- Mock agile-plan generation
- Excel export
- Real local database file at `data/portfolio.sqlite`
- Portfolio page with mock FSO studies and FSP projects / role requirements
- Separate architecture and design PDF in `docs/CPMS Architecture and Design.pdf`

## Verification

```powershell
npm.cmd run build
npm.cmd test
npm.cmd audit --audit-level=moderate
```

## Deploy Online

This prototype can deploy as one Node web service. The Express server serves both:

- the API routes at `/api/*`
- the built React app from `dist/`

### Render

1. Push this folder to a GitHub repository.
2. In Render, create a new Web Service from that repository.
3. Use these settings:

```text
Environment: Node
Build Command: npm install && npm run build
Start Command: npm start
Health Check Path: /api/health
```

The included `render.yaml` contains the same settings if you prefer Render blueprints.

Note: the current database is a local file at `data/portfolio.sqlite`. That is fine for a public demo/mock prototype, but hosted changes may reset on redeploy unless the hosting service provides persistent disk storage.

## Architecture and Design Documentation

Architecture and design documentation is intentionally outside the app UI:

```text
docs/CPMS Architecture and Design.pdf
```

The current local database uses mock portfolio data only. FSO records are represented as mock clinical studies, and FSP work is represented as smaller projects or role requirements.
