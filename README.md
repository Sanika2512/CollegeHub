# CollegeHub - College Discovery Platform MVP

## Live Demo
https://collegehub-vlzc.onrender.com/

Production-grade MVP for discovering, saving, reviewing, and comparing Indian colleges.

## Stack

- Next.js 14 App Router, React, TypeScript
- TailwindCSS
- Next.js API routes
- PostgreSQL with Prisma ORM
- NextAuth.js credentials + Google OAuth
- bcryptjs password hashing
- react-hook-form + zod validation
- Zustand compare state synced to URL and localStorage

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env vars:

```bash
cp .env.example .env
```

3. Configure `.env`:

- `DATABASE_URL`: PostgreSQL connection string.
- `NEXTAUTH_URL`: Usually `http://localhost:3000` locally.
- `NEXTAUTH_SECRET`: Long random secret for JWT/session signing.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Google OAuth credentials. Leave blank if only credentials auth is needed locally.

Local development connection used in this workspace:

```env
DATABASE_URL="postgresql://postgres:sanu%40123@localhost:5432/college_platform"
```

4. Create and seed the database:

```bash
npm run prisma:migrate -- --name init
npm run prisma:seed
```

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3002'.

## Prisma Commands

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run prisma:deploy
npm run db:studio
```

Use `npm run prisma:migrate -- --name <migration_name>` locally when changing the schema. Use `npm run prisma:deploy` in production to apply committed migrations without prompts.

## Database Health Checks

After the app is running:

```bash
curl http://localhost:3002/api/health/db
curl http://localhost:3002/api/examples/colleges-count
curl "http://localhost:3002/api/colleges?page=1"
```

Expected results:

- `/api/health/db` returns `ok: true`.
- `/api/examples/colleges-count` returns data from PostgreSQL only.
- `/api/colleges` returns seeded college rows from PostgreSQL.

## Demo Login

After seeding:

- Email: `demo@collegehub.test`
- Password: `password123`

## Features

- `/colleges`: server-side searchable listing with filters and pagination.
- `/colleges/[slug]`: tabbed detail page with overview, courses, placements, reviews, sticky save/compare CTAs.
- `/compare`: 2-3 college comparison, best-value highlighting, localStorage + URL sync, DB save when logged in.
- `/dashboard/saved`: saved colleges grid with optimistic remove via Save button.
- `/dashboard/comparisons`: saved comparison history.
- `/auth/login` and `/auth/signup`: credentials auth and Google OAuth entry point.
- Homepage includes featured colleges, animated stats, a JEE rank college predictor, and recently viewed colleges.

## API Routes

- `GET /api/colleges`
- `GET /api/colleges/[slug]`
- `GET /api/colleges/[slug]/reviews`
- `POST /api/colleges/[slug]/reviews`
- `GET /api/compare?ids=id1,id2`
- `POST /api/compare`
- `GET /api/saved`
- `POST /api/saved`
- `DELETE /api/saved/[collegeId]`
- `POST /api/auth/signup`
- `GET /api/health/db`
- `GET /api/examples/colleges-count`

## Vercel + Neon Deployment

1. Create a Neon project and database for production.
2. Copy the Neon PostgreSQL connection string.
3. In Vercel, add these environment variables for Production, Preview, and Development as needed:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
NEXTAUTH_URL="https://your-vercel-domain.vercel.app"
NEXTAUTH_SECRET="your-production-random-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

4. Before or during deployment, apply migrations to Neon:

```bash
DATABASE_URL="your-neon-connection-string" npm run prisma:deploy
```

5. Seed production only if you want demo data:

```bash
DATABASE_URL="your-neon-connection-string" npm run prisma:seed
```

6. Deploy to Vercel. The app build runs Prisma generate before Next.js build.

For Neon, use a direct non-pooled connection string when running migrations. Runtime API routes can use Neon’s standard connection string with SSL enabled. Data persists in Neon because all application reads and writes go through Prisma/PostgreSQL.

## Notes

Seed data is realistic demo data for product development. Verify official fee, placement, ranking, and admission data before using it for admission advice.
