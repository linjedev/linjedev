# Deploy Linje.dev to Cloudflare Pages

## Option A: Direct Upload

1. In Cloudflare, open **Workers & Pages**.
2. Create a Pages project.
3. Choose **Direct Upload**.
4. Upload `dist-pages/linje-dev-pages.zip`.
5. Add the custom domain `linje.dev`.

## Option B: Git

Use these Cloudflare Pages settings:

- Project name: `linje-dev`
- Build command: none
- Build output directory: `speedtest-app`
- Root directory: repo root

## Domain

Cloudflare nameservers assigned for `linje.dev`:

- `ernest.ns.cloudflare.com`
- `keira.ns.cloudflare.com`

When the zone is active, add `linje.dev` as the Pages custom domain. Cloudflare will provision HTTPS automatically.

## Login/Register Database

Linje.dev uses Cloudflare Pages Functions and a D1 database binding named `DB`.

1. In Cloudflare, open **Workers & Pages > D1 SQL Database**.
2. Create a database named `linje-auth`.
3. Open that database console and run the SQL from:
   - `migrations/0001_linje_auth.sql`
4. Open **Workers & Pages > Pages > icelandtrip-travelnformation > Settings > Functions > D1 database bindings**.
5. Add a binding:
   - Variable name: `DB`
   - D1 database: `linje-auth`
6. Add Pages environment variables:
   - `CAPTCHA_SECRET`: at least 32 random characters, used to sign captcha tokens.
   - `ADMIN_USERS`: comma-separated usernames that can read `/api/admin/events`, for example `seb`.
7. Redeploy the latest Pages deployment.

The auth endpoints live in the repository root `functions/` directory:

- `POST /api/register`
- `POST /api/login`
- `GET /api/session`
- `POST /api/logout`

Passwords are salted and hashed with PBKDF2-SHA-256 before they are stored. Sessions are stored in D1 and sent to the browser as HttpOnly cookies.

Registration and login do not collect email addresses. The `auth_events` table stores security audit records for register/login attempts:

- username
- success/failure and failure reason
- IP address from Cloudflare/request headers
- user agent
- Cloudflare country, colo, ASN, and Ray ID when available
- browser-provided language, timezone, screen size, viewport, and platform

Use this for account security and abuse investigation, and disclose it in a privacy notice before launch.

## GitHub Commit Tracker

The home page commit tracker uses a Cloudflare Pages Function at:

- `GET /api/github/commits`

Create a fine-grained GitHub token with read-only contents access to the private repository or repositories you want counted, then add it to the Pages project environment variables:

- `GITHUB_TOKEN`: the GitHub token
- `GITHUB_COMMIT_QUERY`: optional, defaults to `author:linjedev`

The function runs GitHub commit search with that query and returns only the query, total commit count, hourly activity buckets, and cache duration. It caches the GitHub result for 60 seconds so the tracker updates on refresh without calling GitHub on every page load.

## Email Routing

After the zone is active:

1. Open **Email > Email Routing** for `linje.dev`.
2. Enable Email Routing.
3. Create addresses like:
   - `hello@linje.dev`
   - `support@linje.dev`
4. Route them to `linjedev@gmail.com`.
5. Let Cloudflare add the MX/TXT records automatically.
