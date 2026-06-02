# ADR-001 Feature Flags

Single source of truth for all feature flags introduced by
[ADR-0001](architecture/decisions/adr-0001-decentralized-plugin-auth-and-ssrf-mitigation.md)
(Decentralized Plugin Auth + SSRF Mitigation).

**Keep the per-environment table current** whenever a flag is set, changed, or
removed in Coolify. Drift between staging and production is the primary paper-cut
this doc exists to prevent.

---

## Flag Inventory

### 5 Master-Plan Flags

| Flag | Repo | Default | Meaning |
|---|---|---|---|
| `NEXT_PUBLIC_WWV_TICKET_AUTH_PLUGINS` | **Local App** | `""` (empty = dormant) | Comma-separated plugin IDs that require WS first-message auth, for example `aviation,maritime`. Empty or unset means ticket auth disabled for all plugins. Set after Marketplace + Data Engine are deployed. |
| `REQUIRE_TICKET_AUTH` | **Data Engine** | `false` | When `true`, the engine rejects any WS connection that does not present a valid ticket. Global; applies to all plugins. Replaces `WWV_SKIP_WS_AUTH=false` once JWKS is wired. |
| `REQUIRE_TICKET_AUTH_PLUGINS` | **Data Engine** | `""` | Comma-separated plugin IDs for per-plugin enforcement before enabling the global flag. Not yet implemented. |
| `ENFORCE_ORIGIN_ALLOWLIST` | **Data Engine** | `false` | When `true`, the engine rejects connections from Origins not in its configured allowlist. Enable after populating the allowlist from observed traffic. |
| `PROXY_HOST_ALLOWLIST` | **Local App** | `""` (deny all) | SSRF allowlist for camera and iframe proxy routes. `""` or unset = deny all. Comma-separated list = explicit allowlist. Wildcard mode is disabled. |

### Deployed Reality: `WWV_SKIP_WS_AUTH`

> **Divergence note:** The Data Engine workstream implemented a single global bypass
> flag (`WWV_SKIP_WS_AUTH`) instead of the three granular master-plan flags
> (`REQUIRE_TICKET_AUTH`, `REQUIRE_TICKET_AUTH_PLUGINS`, `ENFORCE_ORIGIN_ALLOWLIST`).
> The master-plan flags remain the target architecture and must be implemented before
> step 7. `WWV_SKIP_WS_AUTH` is the current interim control.

| Flag | Repo | Default | Meaning |
|---|---|---|---|
| `WWV_SKIP_WS_AUTH` | **Data Engine** | `false` | When `true`, every WS connection is pre-authenticated and no JWT is checked. It must be replaced by JWKS-backed ticket auth before global enforcement. |

---

## Per-Environment Table

Update this table whenever a flag changes in Coolify.

| Flag | Local dev | Staging | Production | Last updated |
|---|---|---|---|---|
| `NEXT_PUBLIC_WWV_TICKET_AUTH_PLUGINS` | `""` (.env.example) | `""` (not set) | `""` (not set) | 2026-05-21 |
| `REQUIRE_TICKET_AUTH` | N/A | N/A | N/A (not yet implemented) | - |
| `REQUIRE_TICKET_AUTH_PLUGINS` | N/A | N/A | N/A (not yet implemented) | - |
| `ENFORCE_ORIGIN_ALLOWLIST` | N/A | N/A | N/A (not yet implemented) | - |
| `PROXY_HOST_ALLOWLIST` | `""` (.env.example) | explicit allowlist | explicit allowlist | 2026-06-02 |
| `WWV_SKIP_WS_AUTH` | `false` | TBD | true until JWKS rollout | 2026-05-20 |

---

## Rollout Sequence

The sequence in which flags are set during the ADR-001 deploy order:

| Deploy step | Service | Flag change | Notes |
|---|---|---|---|
| Step 1 | Local App | Set `PROXY_HOST_ALLOWLIST=<observed-list>` | Default-deny proxy; add only hosts required by camera providers. |
| Step 3 | Local App | `NEXT_PUBLIC_WWV_TICKET_AUTH_PLUGINS=""` confirmed empty | Dormant; no change needed, just confirm. |
| Step 4 | Data Engine | JWKS wired; `WWV_SKIP_WS_AUTH` remains `true` | Both paths exist, neither enforced. |
| Step 5 (staging) | Local App | `NEXT_PUBLIC_WWV_TICKET_AUTH_PLUGINS=test-synthetic` | Smoke test only; revert after. |
| Step 5 (staging) | Data Engine | `WWV_SKIP_WS_AUTH=false` | Prove real JWT verification end-to-end. |
| Step 6 | Local App | `NEXT_PUBLIC_WWV_TICKET_AUTH_PLUGINS=<first-real-plugin>` | One plugin at a time, 24 h soak. |
| Step 6 | Data Engine | `REQUIRE_TICKET_AUTH_PLUGINS=<same-plugin>` | Mirror Local App change. |
| Step 7a | Data Engine | `REQUIRE_TICKET_AUTH=true` | Global default-deny; 24 h soak. |
| Step 7b | Data Engine | `ENFORCE_ORIGIN_ALLOWLIST=true` | After populating allowlist from observed connections. |
| Step 7c | Local App | `PROXY_HOST_ALLOWLIST=<observed-list>` | Confirm production remains on explicit host list. |

---

## Rollback

Every step is independently revertable by flipping its single flag back. The old
no-auth data path remains wired throughout steps 1-6 and is only superseded at
step 7a. If anything breaks, removing the plugin from
`NEXT_PUBLIC_WWV_TICKET_AUTH_PLUGINS` immediately restores the old path for that
plugin.
