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
| `SEED_ON_DEPLOY` | `sample` — this tells the app to automatically load 10 example vehicles + 2 drivers + your admin account the first time it starts, so you have something to click. (Prefer to start empty with only your admin? Use `admin` instead.) |

> Optional: also add `SEED_ADMIN_EMAIL` (your real email) and `SEED_ADMIN_PASSWORD`
> (a password you choose) so your admin account is created with your own login
> instead of the default. If you skip these, the default is
> `office@llewellynplumbing.com` / `ChangeMe!2026`.

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

## Part 4 — Your data loads itself (no command line!)

Because you set `SEED_ON_DEPLOY=sample` in Part 2, the app **automatically** creates
your admin account and loads the sample fleet the first time it starts. There is
**nothing to run** — it's already done by the time the deploy finishes.

Default logins (change them right away — see Part 6):
- Admin: `office@llewellynplumbing.com` / `ChangeMe!2026`
- Driver: `mike@example.com` / `driver1234` (Truck 1)
- Driver: `sara@example.com` / `driver1234` (Truck 2)

> After you've logged in once and added your real vehicles, you can go back to
> **Variables** and change `SEED_ON_DEPLOY` to `admin` (or delete it). Leaving it on
> `sample` is harmless — it never duplicates or overwrites your real data.

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
- **Can't log in:** make sure `SEED_ON_DEPLOY` is set (Part 2) and the app has
  redeployed since — that's what creates your admin account. Check the Deploy Logs
  for a line that says "Admin ready" or "Seed complete".
- **A document won't open:** confirm the `/data` volume is attached (Part 1, step 3).
