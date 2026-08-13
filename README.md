# Mini CRM

Sales Pipeline Management for Small Businesses

[Live Demo](https://mini-crm-opal-two.vercel.app) | [Repository](https://github.com/Antophic/Mini-CRM)

Mini CRM is a full-stack sales workspace for tracking prospects, deal values,
follow-ups, and client activity in one lightweight application.

![Mini CRM Dashboard](public/mini-crm-dashboard.webp)

## Problem

Small businesses often manage leads with spreadsheets, scattered notes, and
manual follow-up lists. That makes it easy to lose context, miss opportunities,
or forget which deal needs attention next.

## Solution

Mini CRM provides a focused workspace for managing clients through a sales
pipeline. Users can register, sign in, add prospects, track statuses, store
notes, filter records, and monitor dashboard metrics from a real database-backed
application.

## Features

- Register, login, logout, and current-user session check
- JWT authentication with HTTP-only cookies
- User roles: `USER` and `ADMIN`
- Role-based ownership authorization
- Client notes CRUD
- Sales pipeline stages
- Dashboard metrics from database queries
- Search, status filtering, sorting, and pagination
- Activity log for important CRM actions
- Centralized API error handling
- Input validation with Zod
- Security middleware for headers, CORS, rate limiting, and request size limits

## Tech Stack

- Frontend: React, Vite, TypeScript
- Backend: Node.js, Express.js, TypeScript
- Database: MySQL
- ORM: Prisma
- Auth: JWT, bcrypt password hashing
- Validation: Zod

## Authorization Model

Mini CRM uses role-based ownership authorization. Standard users can access only
their own CRM records, while administrators can access system-wide records for
operations and oversight. The same rule is applied to client data, notes,
pipeline views, and dashboard metrics.

## Project Structure

```text
backend/
  docs/openapi.yaml
  prisma/
    migrations/
    schema.prisma
    seed.ts
  src/
    config/
    constants/
    controllers/
    middlewares/
    repositories/
    routes/
    services/
    types/
    utils/
    validators/
src/
  api/
  components/
  constants/
  hooks/
  utils/
  MiniCrmApp.tsx
  demoData.ts
  styles.css
```

## Environment Variables

Frontend `.env.local`:

```bash
VITE_API_URL=http://localhost:3000/api
```

Backend `backend/.env`:

```bash
DATABASE_URL="mysql://root:password@localhost:3306/mini_crm"
JWT_SECRET="replace-with-a-random-secret-at-least-32-characters"
JWT_EXPIRES_IN="1d"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
COOKIE_NAME="mini_crm_token"
COOKIE_SECURE=false
COOKIE_SAME_SITE="lax"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
REQUEST_BODY_LIMIT="100kb"
```

Never commit real `.env` files.

## Database Setup

Create a MySQL database, then run:

```bash
cd backend
npm install
npm run prisma:generate
npm run db:dev
npm run db:seed
```

The schema creates:

- `users`
- `pipeline_stages`
- `clients`
- `client_notes`
- `activity_logs`

## Run Locally

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
npm install
npm run dev
```

Open the Vite URL and create an account from the login screen.

## API Documentation

OpenAPI spec:

```text
backend/docs/openapi.yaml
```

All mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) require:

```http
X-CSRF-Protection: 1
```

Main endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/clients/:id`
- `PUT /api/clients/:id`
- `PATCH /api/clients/:id`
- `DELETE /api/clients/:id`
- `GET /api/clients/:id/notes`
- `POST /api/clients/:id/notes`
- `PUT /api/clients/:id/notes/:noteId`
- `DELETE /api/clients/:id/notes/:noteId`
- `GET /api/pipeline/stages`
- `GET /api/dashboard`

## Quality Checks

Frontend:

```bash
npm run typecheck
npm run lint
npm test
```

Backend only:

```bash
cd backend
npm run typecheck
npm run lint
npm test
```

## Deploy to Vercel

This repository can run the React frontend and Express API in one Vercel project.

Use these Vercel settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Set production environment variables in Vercel:

```bash
DATABASE_URL="mysql://USER:PASSWORD@MYSQL_HOST:3306/mini_crm"
JWT_SECRET="use-a-long-random-production-secret"
JWT_EXPIRES_IN="1d"
CORS_ORIGIN="https://your-vercel-domain.vercel.app"
NODE_ENV="production"
COOKIE_NAME="mini_crm_token"
COOKIE_SECURE=true
COOKIE_SAME_SITE="lax"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
REQUEST_BODY_LIMIT="100kb"
VITE_API_URL="/api"
```

Laragon is only for local development. Vercel cannot connect to MySQL running on
your laptop. Use an online MySQL provider such as Railway, Aiven,
PlanetScale-compatible MySQL, DigitalOcean Managed MySQL, or another public
MySQL host.

After setting `DATABASE_URL` for the online database, run the migration against
that production database:

```bash
npm run db:migrate
npm run db:seed
```
