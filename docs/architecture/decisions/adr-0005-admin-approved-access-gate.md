# Admin Approved Access Gate

## Context

Linje.track is moving from a public demo-style globe to a private operational surface. The app still needs first-run setup, credential login, plugin and tracking APIs, and a way for new users to request access without being able to view the globe before approval.

## Decision

Use the existing Auth.js credentials flow and Prisma `User` table as the access authority. Users now carry a `status` value of `pending`, `approved`, or `denied`; admins are created as approved; newly registered users are pending until an admin approves them from `/admin`. Page routes are private by default, while setup, login, registration, static assets, and API routes needed by the app remain reachable.

## Consequences

The private app workflow is straightforward to operate from inside Linje.track and keeps approval state in the same database as users. It also means the production deployment must run the Next app with its database migrations applied for the full approval panel to work; a static proxy deployment can only provide a coarse entry gate, not durable user approval storage.
