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

## Email Routing

After the zone is active:

1. Open **Email > Email Routing** for `linje.dev`.
2. Enable Email Routing.
3. Create addresses like:
   - `hello@linje.dev`
   - `support@linje.dev`
4. Route them to `linjedev@gmail.com`.
5. Let Cloudflare add the MX/TXT records automatically.
