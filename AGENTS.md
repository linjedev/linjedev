# Codex project guidance

This project is a static interactive road-trip map. Keep it simple and usable as a standalone static site.

## Priorities

- Preserve the planned 8-day clockwise Iceland route.
- Preserve user-facing route notes, road numbers, road-type warnings, and fuel/cost assumptions unless explicitly asked to update them.
- Do not add server-only dependencies unless necessary.
- Prefer static JSON/GeoJSON files over hard-coded data inside `index.html`.
- Keep the app deployable on GitHub Pages.

## Validation

After changes, run a local static server and verify:

- the map tiles load,
- day route toggles work,
- road labels/warnings appear,
- clicking stops opens useful popup information,
- the page still works at mobile and desktop widths.
