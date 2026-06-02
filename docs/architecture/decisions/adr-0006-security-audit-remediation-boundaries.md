# Security Audit Remediation Boundaries

## Context

The 2026-06-02 security audit found that Linje.track had two overlapping access-control systems: the main NextAuth/Prisma application gate and a Cloudflare Worker overlay. The Worker accepted raw owner-name cookies, used static secrets, stored access-request passwords in plaintext, and injected tracked map tokens into browser storage. Several API routes were also reachable because the global proxy passes `/api/*` through for route-level authorization.

## Decision

Linje.track will use the application database and explicit signed credentials as the access authority. Any edge-only gate must use signed edge sessions, environment-provided secrets, and password hashes. It must not treat a cookie name or raw username as proof of authentication. App API routes are private by default unless they are explicitly public health/build/auth/captcha endpoints. Public or cross-origin routes must document their reason, rate-limit abusive calls, and avoid server-key fallbacks for anonymous users.

## Consequences

Authentication becomes easier to reason about because there is no trusted raw-cookie side door. User passwords and service keys stop living in source code. The trade-off is operational: Cloudflare deployments now require proper secret bindings before login/register works, and some data APIs require authenticated sessions where anonymous demos previously worked. Existing plaintext Worker access-store records must be treated as compromised and reset rather than migrated silently.
