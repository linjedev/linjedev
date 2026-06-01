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
   - `migrations/0002_arcade_scores.sql`
   - `migrations/0003_secure_messages.sql`
   - `migrations/0004_app_config.sql`
   - `migrations/0005_world_news.sql`
   - `migrations/0006_world_news_access.sql`
4. Open **Workers & Pages > Pages > icelandtrip-travelnformation > Settings > Functions > D1 database bindings**.
5. Add a binding:
   - Variable name: `DB`
   - D1 database: `linje-auth`
6. Add Pages environment variables:
   - `CAPTCHA_SECRET`: at least 32 random characters, used to sign captcha tokens. If omitted, Linje.dev creates a durable fallback secret in D1.
   - `ADMIN_USERS`: comma-separated usernames that can read admin APIs, for example `seb`. If omitted, `seb` is treated as the owner account.
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

By default, the live tracker reads repository commit activity from `linjedev/linjedev` when GitHub allows public access. For private repositories or higher rate limits, create a fine-grained GitHub token with read-only contents access and add it to the Pages project environment variables:

- `GITHUB_TOKEN`: optional GitHub token
- `GITHUB_REPOSITORY`: optional repository name, defaults to `linjedev/linjedev`
- `GITHUB_COMMIT_QUERY`: optional search query override

The function returns only the query, total commit count, hourly activity buckets, and cache duration. It caches the GitHub result for 60 seconds so the tracker updates on refresh without calling GitHub on every page load.

## Email Routing

After the zone is active:

1. Open **Email > Email Routing** for `linje.dev`.
2. Enable Email Routing.
3. Create addresses like:
   - `hello@linje.dev`
   - `support@linje.dev`
4. Route them to `linjedev@gmail.com`.
5. Let Cloudflare add the MX/TXT records automatically.
