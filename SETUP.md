# Llewellyn Fleet — Setup Guide

This guide gets your fleet app online using **GitHub + Railway**. It's written in
plain language. You do **not** need to be a developer. Total time: about 30–45
minutes, most of it waiting for things to install.

**What lives where (so you're never confused):**
- **Your code** → GitHub (already pushed).
- **Your app + database + uploaded files** → Railway.
- **Your secret keys** → stored only in Railway's settings, never in the code.

---

## Part 1 — Put the code on Railway

### 1. Create a Railway project
1. Go to **railway.app** and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Choose the **`office749/fleet-management`** repository.
4. When asked which branch, pick the branch these files are on
   (`claude/fleet-management-spec-6ggoz7`) — or merge it into `main` first and use
   `main`. Railway will start building. It will fail the first time because the
   database isn't set up yet — that's expected. Keep going.

### 2. Add the database
1. In your project, click **New** → **Database** → **Add PostgreSQL**.
2. Railway creates a Postgres database with private networking. Nothing else to do
   here yet.

### 3. Add a disk for uploaded files
1. Click your **app service** (not the database) → **Settings** → **Volumes**.
2. Click **Add Volume**. Set the **Mount path** to exactly: `/data`
3. Save. This is where insurance/registration PDFs, receipts, and photos live.

---

## Part 2 — Settings (your secret keys)

Open your **app service** → **Variables** tab, and add these four:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Click **Add Reference** → pick your Postgres → `DATABASE_URL`. (This wires the app to the database over Railway's private network.) |
| `AUTH_SECRET` | A long random string that signs logins. In the value box, Railway lets you generate one — or paste any 40+ random characters. Keep it secret. |
| `FILE_STORAGE_DIR` | `/data` |
| `AUTH_URL` | Your app's public web address (you'll get it in Part 3, step 2 — come back and fill this in). |

> You never put these in the code. They live here in Railway only. To change your
> admin password later you use the app, not these settings.

---

## Part 3 — Deploy and get your web address

1. Railway will redeploy automatically after you add variables. Watch the **Deploy
   Logs** — when it says the server is ready, the app is live. (On startup it
   automatically sets up all the database tables — you never run database commands
   by hand.)
2. Go to **Settings → Networking → Generate Domain**. Railway gives you a URL like
   `https://fleet-management-production.up.railway.app`.
3. Copy that URL into the `AUTH_URL` variable from Part 2, then let it redeploy once
   more.

---

## Part 4 — Load your starting data

You need at least an admin account to log in. Pick **one** of these. Both use the
**Railway CLI** (a small helper tool) once:

**Install the helper (one time):**
- On Mac: open Terminal and run `brew install railway` (or see docs.railway.app/cli).
- Then run `railway login` and follow the browser prompt, then `railway link` and
  pick your project.

**Then choose:**

- **Option A — Try it with sample data (recommended first):** loads 10 example
  vehicles and 2 example drivers so you can click around immediately.
  ```
  railway run npm run db:seed
  ```
  Sample logins it prints:
  - Admin: `office@llewellynplumbing.com` / `ChangeMe!2026`
  - Driver: `mike@example.com` / `driver1234` (Truck 1)
  - Driver: `sara@example.com` / `driver1234` (Truck 2)

- **Option B — Start empty with just your admin account:**
  ```
  railway run npm run db:admin
  ```
  This creates one admin (`office@llewellynplumbing.com` / `ChangeMe!2026`) and no
  vehicles.

> **Change these passwords immediately** after your first login (see Part 6). You
> can also set your own email/password first by adding `SEED_ADMIN_EMAIL` and
> `SEED_ADMIN_PASSWORD` variables in Railway before running the command.

---

## Part 5 — Open the app

Go to your Railway URL and sign in with the admin login. On a phone, tap the
browser's **"Add to Home Screen"** to install it like an app.

---

## Part 6 — Add your real fleet (do this once you're live)

1. **Change your admin password:** go to **Team**, find your account, click **Reset
   password**, set a strong one.
2. **Add a vehicle:** **Vehicles → Add vehicle.** Fill in the label ("Truck 3"),
   VIN, plates, insurance and registration dates, and thresholds. Save.
3. **Invite your first driver:** **Team → Add a team member.** Two ways:
   - *Set a password now* — good for drivers who don't use email. Type a password,
     save, and text/tell it to them along with the web address.
   - *Send an invite link* — copy the private link it generates and text/email it;
     they set their own password.
4. **Assign the driver to a vehicle:** open the vehicle and pick the driver under
   **Driver**, or do it on the Add-vehicle screen.
5. If you loaded sample data and want it gone, you can delete the sample vehicles
   and drivers from the app, or ask to have the database reset.

That's it — your driver logs in on their phone and lands straight on their vehicle
to submit weekly mileage.

---

## Costs (Railway, usage-based, ~10 users)
Roughly **$10–15/month**: the app (~$5–7), the database (~$4–6), and pennies for the
file disk. Railway's $5 Hobby credit offsets part of it. It grows gradually as you
add trucks and drivers — no sudden jumps.

## Using your logo
Drop your official logo file at `public/logo.svg` (or `.png`) and it can replace the
text wordmark in the header. The brand colors (Llewellyn Blue `#1B74BB`, Dark Blue
`#114B78`) are already applied and all live in one file (`tailwind.config.ts`).

## Phase 2 (already prepared for, built later)
Email/text reminders for missed mileage and expirations, driver weekly condition
photos, vehicles shared by multiple drivers, and fuel tracking. The database is
already built to support these, so adding them later won't require a rebuild.

## Something not working?
- **Build failed on the very first deploy:** normal before the database exists —
  finish Parts 1–2, it redeploys fine.
- **Can't log in:** make sure you ran Part 4 to create your admin account.
- **A document won't open:** confirm the `/data` volume is attached (Part 1, step 3).
