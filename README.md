# Soblait CRM

A full-stack CRM web app — Node/Express + Postgres (Supabase) backend, React (Vite) + Tailwind frontend.
Styled after a clean SaaS CRM look (purple-to-pink gradient, rounded cards) and rebranded as **Soblait**.

> The backend connects to any standard Postgres database via a `DATABASE_URL` connection string using the `pg` npm package. It's built to work great with [Supabase](https://supabase.com)'s free hosted Postgres tier, but any Postgres instance (local, RDS, Neon, etc.) works too.

## Features

- Email/password auth (JWT, stored in localStorage)
- Dashboard with an AI-style assistant that computes real answers from your data (pipeline summary, focus-for-today, follow-up drafts, at-risk deals)
- Leads CRUD with status/source/search filtering
- Opportunities with Board / Kanban / List views, editable pipeline stages
- Act Now: computed next-best-actions feed (overdue tasks, deals closing soon, stale leads)
- Smart Calendar: month grid with task/close-date chips, add events, "Sync Google Calendar" (stub)
- Tasks board (Todo / In Progress / Done) with priority badges
- Reports & Analytics: stat cards, Pipeline by Stage bar chart (recharts), CSV export
- Automations: quick-start templates, active rules, execution log
- Galaxy: placeholder page
- System Settings hub: Team & Users, Audit Log (real, auto-logged), Pipeline Stages, System Tags, Onboarding Templates, Integrations (stub connect toggle), Email Templates

## Project structure

```
soblait-crm/
  backend/     Express API + Postgres (via `pg`, pointed at Supabase or any Postgres DB)
  frontend/    Vite + React + Tailwind
```

## Setting up your free Supabase database

1. Go to [supabase.com](https://supabase.com) and sign up for a free account (no credit card required).
2. Click **New Project**, choose an organization, name the project (e.g. `soblait-crm`), set a database password (save it somewhere safe), pick a region close to you, then click **Create new project** (takes ~2 minutes to provision).
3. Once the project is ready, go to **Project Settings → Database → Connection string → URI** and copy it.
4. Paste that connection string into `backend/.env` as `DATABASE_URL=...`, replacing `[YOUR-PASSWORD]` with the database password you set in step 2.
5. Run `npm install && npm run dev` in `backend/` as usual — it will create all tables and seed demo data automatically in your Supabase project the first time it connects.

Note: Supabase free-tier projects automatically pause after 7 days of inactivity and need a manual "Resume" click in the dashboard to wake back up. That's fine for a demo/personal project, just something to be aware of.

## Running locally

### Backend

```bash
cd backend
npm install
npm run dev
```

Make sure `backend/.env` has a valid `DATABASE_URL` pointing at your Supabase project (see above) or any other Postgres instance. Runs on **http://localhost:3001**. On first run it connects to the database, migrates the schema, and seeds demo data (leads, opportunities, tasks, pipeline stages, tags, templates, team members, audit log entries) if the tables are empty.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on **http://localhost:5173** and proxies `/api/*` requests to the backend on port 3001 (see `vite.config.js`).

## Demo login

- **Email:** `Ophir.shalev@soblait.com`
- **Password:** `demo1234`

(Also shown on the login screen.)

## Deploying for real

- **Backend (Render.com):** create a new Web Service from this repo's `backend/` folder, build command `npm install`, start command `npm start` (or `node server.js`). Set env vars `PORT` (Render sets this automatically), `JWT_SECRET`, and `DATABASE_URL` (your Supabase connection string). Because the data lives in Supabase/Postgres rather than a local file, there's no need for a persistent disk — the backend is stateless and safe to redeploy or scale horizontally.
- **Frontend (Vercel / Netlify):** deploy the `frontend/` folder as a static build (`npm run build`, output dir `dist`). Set an env var `VITE_API_URL` pointing at your deployed backend URL, and update `src/api/client.js`'s `baseURL` to use it (falls back to the `/api` proxy in dev).
- **All-in-one (Railway):** Railway can host both the Express backend and a static frontend build (or serve the built frontend from Express) in one project. Just set `DATABASE_URL` to your Supabase connection string (or a Railway-hosted Postgres instance) as an env var — no volume needed since the database lives outside the app.
