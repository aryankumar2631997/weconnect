# WeConnect Lakhisarai

A lead-generation platform for local home services in Lakhisarai, Bihar.
Customers request a service (electrician, plumber, AC repair, etc.) in a few
taps; the request lands as a lead in an admin dashboard, where it gets
assigned to a verified local provider and tracked through to completion.

Flow: **Customer → WeConnect → Local provider → Job completed.**

## Stack

- **Backend:** Node.js + Express, REST API under `/api/v1`
- **Database:** PostgreSQL
- **Frontend:** Plain HTML/CSS/JS (no build step), served by the same Express app
- **Auth:** JWT for the admin dashboard; no accounts/passwords for customers

## Local setup

1. **Install PostgreSQL** if you don't have it, and create a database:
   ```bash
   createdb weconnect
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment.** Copy `.env.example` to `.env` and fill in:
   ```bash
   cp .env.example .env
   ```
   At minimum, set `DATABASE_URL` to point at your local Postgres, and set
   `JWT_SECRET` to any random string (used to sign admin login tokens).

4. **Run migrations:**
   ```bash
   npm run migrate
   ```
   This creates all tables and seeds one admin account:
   **username `admin`, password `admin123`.**
   Change this password before using the app with real customers — see
   "Changing the admin password" below.

5. **Seed sample services** (optional, for local testing):
   ```bash
   npm run seed
   ```

6. **Start the server:**
   ```bash
   npm run dev   # auto-restarts on file changes
   # or
   npm start     # plain node, for production-like runs
   ```

7. Open **http://localhost:3000** for the customer app, and
   **http://localhost:3000/admin.html** for the admin dashboard.

Both are served by the same Express process — there's nothing separate to
run for the frontend.

## Mobile / Play Store

The customer-facing app (`index.html` → `services.html` → `request.html`) is
now a installable Progressive Web App:

- `client/manifest.json` — app name, colors, icons
- `client/sw.js` — caches the app shell (HTML/CSS/JS) so it opens instantly
  on repeat visits; API calls always go to the network, so leads/services
  data is never stale
- `client/icons/` — placeholder icons (swap these for your real logo before
  launch — regenerate `icon-192.png`, `icon-512.png`, and
  `icon-maskable-512.png` at the same sizes)

Once deployed over HTTPS, a customer can "Add to Home Screen" from their
mobile browser and it behaves like a native app icon.

**To publish on the Play Store:** wrap the deployed HTTPS site as a Trusted
Web Activity using Google's [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
CLI. It points at your PWA manifest and generates a small Android project —
no rewrite needed. You'll need a one-time $25 Google Play developer account.
This wraps the *customer* app; the admin dashboard (`/admin.html`) is meant
to be used in a mobile browser directly (or "Add to Home Screen" the same
way) rather than published as a separate store app.

## Changing the admin password

There's no "change password" screen yet. To set a real password, generate a
bcrypt hash and update it directly:

```bash
node -e "require('bcryptjs').hash('YOUR_NEW_PASSWORD', 10).then(console.log)"
```

Then update it in the database:

```sql
UPDATE admin_users SET password_hash = 'PASTE_HASH_HERE' WHERE username = 'admin';
```

## Deploying

This app is one Node process (API + static frontend together), so it fits
any Node hosting platform with an attached Postgres database — Render,
Railway, and Fly.io all work well for a project this size, and all have
free or low-cost tiers suitable for an early pilot.

General steps, regardless of platform:

1. Provision a PostgreSQL database on the platform (or use a separate managed
   Postgres like Supabase/Neon) and copy its connection string.
2. Set environment variables on the platform to match `.env.example`:
   `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD_HASH` (not currently read by
   the app directly, but kept for reference — the real password lives in the
   database, see above), `WHATSAPP_PHONE` (your real business WhatsApp
   number, digits only with country code, e.g. `919876543210`),
   `CORS_ORIGIN` (your deployed domain), `NODE_ENV=production`.
3. Set the start command to `npm start`.
4. Run `npm run migrate` once against the production database (most
   platforms let you run a one-off command, or run it from your machine
   with `DATABASE_URL` pointed at the production database).
5. Visit `/health` on your deployed URL to confirm it's up, then
   `/admin.html` to log in and start adding real providers.

**Before going live:** change the admin password (above), and set
`WHATSAPP_PHONE` to your real number — the customer app reads it from
`/api/v1/config` at runtime, so this is the only place you need to change it.

## Project structure

```
client/     Customer + admin web app (static HTML/CSS/JS)
server/     Express API (routes → controllers → services → db)
database/   Migrations and seed data
```

See `server/src/routes/` for the full API surface.
