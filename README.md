# Llewellyn Fleet

A mobile-first fleet management web app for Llewellyn Plumbing. Drivers submit a
weekly odometer reading and view their vehicle's documents from a phone in under a
minute; admins get a dashboard of what needs attention (expirations, overdue
maintenance, missed readings, driver-reported issues), manage vehicles/service/team,
and export CSVs.

**→ To deploy, follow [`SETUP.md`](./SETUP.md).**

## Tech stack
- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **Prisma** ORM → **PostgreSQL** (Railway)
- **Auth.js (NextAuth v5)** — email/password, admin-invite + set-password, roles
- **Railway** hosts the app, database, and a disk volume for file uploads
- Lightweight **PWA** for offline document viewing

## Security model (no database RLS — enforced in the app)
All data access goes through a single server-side layer in `lib/data/*`, called only
from Server Components / Server Actions / Route Handlers. Every driver query is
scoped to their actively-assigned vehicle (`lib/data/vehicles.ts:assertVehicleAccess`).
Costs are admin-only: the driver service view (`lib/data/service.ts`) omits the cost
column entirely. Uploaded files are never public URLs — they stream through authed
routes (`app/api/files`, `/api/receipts`, `/api/issue-photos`).

## Project layout
```
app/
  login, invite/[token]          auth screens
  (driver)/home                  one-screen driver experience
  (admin)/dashboard|vehicles|service|team|export
  api/auth | files | receipts | issue-photos | export
lib/
  data/*        scoped data-access layer (the security boundary)
  week.ts       Mountain-Time Monday–Sunday week math
  validation.ts VIN (17 chars, no I/O/Q) + mileage rules
  storage.ts    file volume read/write
prisma/
  schema.prisma, seed.ts (sample fleet), bootstrap-admin.ts
```

## Local development
```bash
cp .env.example .env.local          # fill in DATABASE_URL + AUTH_SECRET
npm install
npm run db:migrate                  # create tables
npm run db:seed                     # sample fleet + logins (printed to console)
npm run dev                         # http://localhost:3000
```
Sample logins after seeding: admin `office@llewellynplumbing.com` / `ChangeMe!2026`;
drivers `mike@example.com` and `sara@example.com` / `driver1234`.

## Branding
Colors and fonts (Llewellyn Blue `#1B74BB`, Dark Blue `#114B78`, Arial/Georgia) live
in `tailwind.config.ts` and `app/globals.css`. Green/amber/red are reserved for
status meaning. Drop an official logo at `public/logo.svg` to replace the wordmark.

## Phase 2 (schema-ready)
Email/SMS reminders, driver condition photos, multi-driver vehicles, fuel tracking.
