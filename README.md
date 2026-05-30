# Iceland 8-day road trip map

This is a single-page interactive Leaflet map for an 8-day Iceland road trip starting and ending at Keflavík.

## Files

- `index.html` - the interactive map app.
- `data/iceland_road_type_breakdown.csv` - road-type/day breakdown.
- `data/iceland_8_day_route.kml` - KML route companion file.

## Local preview

From this folder, run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

The map uses external services/CDNs for map tiles, Leaflet assets, and OSRM/OpenStreetMap road routing. If using Codex Cloud to test live route loading, enable limited internet access for the needed domains.

## Suggested Codex tasks

- Split route stop data, road-segment metadata, and UI code out of `index.html` into separate files.
- Replace runtime OSRM calls with precomputed GeoJSON so the map works offline.
- Add a printable day-by-day itinerary panel.
- Add clearer road-type badges for paved roads, gravel/check-surface roads, F-roads, and forbidden off-road areas.
- Add tests/checks to verify every planned segment has a road number/name and F-road flag.
