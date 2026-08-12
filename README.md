# Mini CRM

A full-stack sales pipeline CRM for portfolio and small business workflows.

## Features

- Register, login, logout, and current-user session check
- JWT authentication with HTTP-only cookies
- User roles: `USER` and `ADMIN`
- Client CRUD with ownership authorization
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

Laragon is only for local development. Vercel cannot connect to MySQL running on your laptop. Use an online MySQL provider such as Railway, Aiven, PlanetScale-compatible MySQL, DigitalOcean Managed MySQL, or another public MySQL host.

After setting `DATABASE_URL` for the online database, run the migration against that production database:

```bash
npm run db:migrate
npm run db:seed
```
