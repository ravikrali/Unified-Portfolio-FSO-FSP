# Clinical Portfolio Management Solutions Prototype

Cloudflare-hosted prototype for a CRO hybrid FSO/FSP portfolio management application. It runs as a zero-server public demo on Cloudflare Pages and retains the full-stack Node service for local development.

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

## Cloudflare Pages Deployment

The production site is built as a static Vite application and served from Cloudflare's edge network. In this mode, `sql.js` loads a sanitized copy of the seeded SQLite database in each visitor's browser.

Cloudflare Pages settings:

```text
Production branch: main
Build command: npm run build:cloudflare
Build output directory: dist
Root directory: /
```

The project configuration is also captured in `wrangler.jsonc`. For a manual authenticated deployment:

```powershell
npm.cmd run deploy:cloudflare
```

Cloudflare demo behavior:

- The published SQLite file contains seeded mock data only.
- The Cloudflare build removes local outbox, KPI-comment, user, and non-demo engagement data before publishing.
- Sign-ins, new portfolios, and comments are stored only in that visitor's browser.
- Browser-local changes are not shared between visitors, and clearing site data resets them.
- Contact requests open the visitor's email app with a message addressed to `contact@r2dw.com`; the visitor reviews and sends it from there.
- Assignment email is not sent from the public demo.
- The existing Express mode remains available for local development or a future shared-data backend.

To test the Cloudflare build locally:

```powershell
npm.cmd run preview:cloudflare
```

Production domains:

- `https://strathub360.com`
- `https://www.strathub360.com`

### Node web service (optional shared backend)

The prototype can also deploy as one Node web service. The Express server serves both:

- the API routes at `/api/*`
- the built React app from `dist/`

The former Render and GitHub Pages deployment definitions have been removed. Cloudflare Pages is now the production deployment target.

## Architecture and Design Documentation

Architecture and design documentation is intentionally outside the app UI:

```text
docs/CPMS Architecture and Design.pdf
```

The current local database uses mock portfolio data only. FSO records are represented as mock clinical studies, and FSP work is represented as smaller projects or role requirements.
