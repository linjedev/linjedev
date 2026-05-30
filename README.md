# Travel Planner

A Next.js travel planning web app with local user accounts, SQLite database storage, saved trips, road routing, and route-based place suggestions.

## What This Is Now

This project has moved away from the old single-file static map. The app now uses:

- Next.js App Router for the website and API routes
- Prisma with SQLite for local database storage
- Cookie sessions for local login
- Leaflet/OpenStreetMap for the map
- OSRM for road-following route geometry
- Nominatim for place lookup
- Overpass for food, hotel, fuel, and EV charger suggestions

The old Iceland files in `data/` are kept as reference/import data only. They are not the global app anymore.

## Local Setup

1. Install dependencies:

```powershell
npm install
```

2. Create your local environment file:

```powershell
Copy-Item .env.example .env
```

3. Create the SQLite database:

```powershell
npm run db:push
```

4. Start the website:

```powershell
npm run dev
```

5. Open:

```text
http://localhost:3000
```

## First Login

Use `Create account` the first time. Your users and trips are stored locally in `dev.db`.

## Notes

- `dev.db` is ignored by Git and should stay local.
- Online mapping services are still used for geocoding, road routing, and suggestions.
- The next sensible step is adding an explicit import flow for the old Iceland JSON data instead of seeding it automatically.
