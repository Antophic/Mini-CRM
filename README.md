# Mini CRM

A lightweight sales pipeline management web application built for small businesses and freelance portfolio demos.

## Features

- Supabase authentication
- Client CRUD
- Sales pipeline statuses
- Deal value tracking in USD
- Client notes and activity tracking
- Search and status filtering
- Dashboard metrics
- Multi-user data isolation with row-level security
- Responsive business SaaS interface

## Tech Stack

- React
- TypeScript
- Vite
- Supabase Auth
- Supabase PostgreSQL
- Vercel

## Project Purpose

Mini CRM demonstrates a small internal business tool: authenticated access, user-owned records, CRUD workflows, pipeline tracking, database-backed notes, responsive dashboards, and production deployment readiness.

## Environment Variables

Create `.env.local` for local development or configure the same values in Vercel:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DEMO_EMAIL=
VITE_DEMO_PASSWORD=
```

`VITE_DEMO_EMAIL` and `VITE_DEMO_PASSWORD` are optional public demo account values. Create that user in Supabase Auth before enabling the demo login button.

## Database Setup

Apply the SQL migration in:

```text
supabase/migrations/001_create_crm_schema.sql
```

The migration creates:

- `clients`
- `client_notes`
- ownership columns
- status constraints
- indexes
- update timestamp trigger
- row-level security policies for select, insert, update, and delete

## Run Locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

Use these settings:

- Framework/Preset: `Vite`
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`

Add the environment variables in Vercel before deploying.

## Quality Checks

```bash
npm run lint
npm test
```
