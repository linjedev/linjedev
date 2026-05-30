"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type User = { id: string; email: string; name: string };
type Place = { id?: string; name: string; note?: string };
type Trip = {
  id: string;
  name: string;
  origin: string;
  destination: string;
  vehicle: string;
  routeData: Record<string, unknown>;
  waypoints: Place[];
  ideas: Place[];
};
type Suggestion = { id: string; name: string; type: string; lat: number; lon: number; address?: string; distance: number; kind: string };
type LeafletApi = any;

declare global {
  interface Window {
    L?: LeafletApi;
    __leafletLoading?: Promise<LeafletApi>;
  }
}

const defaults = {
  petrol: { consumption: 8.5, price: 1.55, range: 650 },
  diesel: { consumption: 7.5, price: 1.62, range: 720 },
  electric: { consumption: 20, price: 0.45, range: 360 }
};

export default function TravelPlannerApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authMessage, setAuthMessage] = useState("Create an account first. Your login and trips will be stored in the local SQLite database.");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeId, setActiveId] = useState("");
  const [view, setView] = useState("trips");
  const [status, setStatus] = useState("Create or select a trip to map it.");
  const [suggestionStatus, setSuggestionStatus] = useState("Map a route, then search for places.");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [layers, setLayers] = useState({ route: true, suggestions: true });
  const [distance, setDistance] = useState(0);
  const [costInputs, setCostInputs] = useState(defaults.petrol);
  const [search, setSearch] = useState("");
  const [leafletReady, setLeafletReady] = useState(false);
  const leafletRef = useRef<LeafletApi | null>(null);
  const mapRef = useRef<any>(null);
  const groupsRef = useRef<Record<string, any>>({});
  const routeGeometryRef = useRef<{ lat: number; lon: number }[]>([]);

  const activeTrip = trips.find((trip) => trip.id === activeId) || null;
  const filteredTrips = trips.filter((trip) => [trip.name, trip.origin, trip.destination, trip.vehicle].join(" ").toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    fetch("/api/me").then((res) => res.json()).then((data) => {
      if (data.user) {
        setUser(data.user);
        loadTrips();
      }
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    loadLeaflet().then((leaflet) => {
      if (!mounted) return;
      leafletRef.current = leaflet;
      setLeafletReady(true);
    }).catch(() => {
      if (mounted) setStatus("Could not load the map library. Check your internet connection and refresh.");
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    if (!user || mapRef.current || !L) return;
    const map = L.map("map", { zoomControl: true }).setView([54.5, -2.4], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
    groupsRef.current.route = L.featureGroup().addTo(map);
    groupsRef.current.suggestions = L.featureGroup().addTo(map);
    mapRef.current = map;
  }, [user, leafletReady]);

  useEffect(() => {
    for (const [key, enabled] of Object.entries(layers)) {
      const group = groupsRef.current[key];
      const map = mapRef.current;
      if (!group || !map) continue;
      if (enabled && !map.hasLayer(group)) group.addTo(map);
      if (!enabled && map.hasLayer(group)) map.removeLayer(group);
    }
  }, [layers]);

  async function loadTrips() {
    const res = await fetch("/api/trips");
    const data = await res.json();
    setTrips(data.trips || []);
    if (data.trips?.length && !activeId) setActiveId(data.trips[0].id);
  }

  async function auth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
        name: form.get("name")
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setAuthMessage(data.error || "Could not sign in.");
      return;
    }
    setUser(data.user);
    await loadTrips();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setTrips([]);
    setActiveId("");
  }

  async function demoLogin() {
    const res = await fetch("/api/auth/demo", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setAuthMessage(data.error || "Could not start demo.");
      return;
    }
    setUser(data.user);
    await loadTrips();
  }

  async function saveTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      origin: form.get("origin"),
      destination: form.get("destination"),
      vehicle: form.get("vehicle"),
      waypoints: lines(String(form.get("waypoints") || "")).map((name) => ({ name })),
      ideas: lines(String(form.get("ideas") || "")).map((name) => ({ name }))
    };
    const endpoint = activeTrip ? `/api/trips/${activeTrip.id}` : "/api/trips";
    const method = activeTrip ? "PUT" : "POST";
    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || "Could not save trip.");
      return;
    }
    await loadTrips();
    const trip = data.trip as Trip;
    setActiveId(trip.id);
    setView("planner");
    await mapTrip(trip);
  }

  async function deleteTrip(id: string) {
    await fetch(`/api/trips/${id}`, { method: "DELETE" });
    clearMap();
    setActiveId("");
    setDistance(0);
    setStatus("Trip deleted. Select or create another trip.");
    await loadTrips();
  }

  async function mapTrip(trip = activeTrip) {
    if (!mapRef.current || !leafletRef.current) {
      setStatus("Map is still loading. Try again in a moment.");
      return;
    }
    if (!trip) {
      clearMap();
      setStatus("No active trip selected.");
      return;
    }
    clearMap();
    setStatus("Finding route places...");
    const places = [trip.origin, ...trip.waypoints.map((p) => p.name), trip.destination].filter(Boolean);
    if (places.length < 2) {
      setStatus("Add a start and destination.");
      return;
    }
    try {
      const country = ukHint(places) ? "gb" : "";
      const points = [];
      for (const place of places) points.push(await geocode(place, country));
      points.forEach((point, index) => addMarker(leafletRef.current!, groupsRef.current.route, point.lat, point.lon, String(index + 1), "pin", `${point.name}<br>${point.label}`));
      const coords = points.map((p) => `${p.lon},${p.lat}`).join(";");
      const route = await osrm(coords);
      const latlngs = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
      routeGeometryRef.current = latlngs.map(([lat, lon]: number[]) => ({ lat, lon }));
      leafletRef.current.polyline(latlngs, { color: "#7c3aed", weight: 7, opacity: 0.9 }).addTo(groupsRef.current.route);
      setDistance(route.distance);
      setStatus(`${trip.name} mapped: ${km(route.distance)} · ${hours(route.duration)}.`);
      mapRef.current.fitBounds(groupsRef.current.route.getBounds().pad(0.12));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not map route.");
    }
  }

  async function findSuggestions(kind: string) {
    if (!routeGeometryRef.current.length) {
      setSuggestionStatus("Map a trip before searching for places.");
      return;
    }
    setSuggestionStatus(`Searching for ${labelFor(kind)}...`);
    groupsRef.current.suggestions.clearLayers();
    try {
      const points = sampleRoute(routeGeometryRef.current);
      const query = overpass(points, kind);
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await res.json();
      const items = (data.elements || [])
        .map((el: any) => normaliseSuggestion(el, kind))
        .filter(Boolean)
        .map((item: Suggestion) => ({ ...item, distance: nearestDistance(item, routeGeometryRef.current) }))
        .sort((a: Suggestion, b: Suggestion) => a.distance - b.distance)
        .slice(0, 12);
      setSuggestions(items);
      items.forEach((item: Suggestion) => addMarker(leafletRef.current!, groupsRef.current.suggestions, item.lat, item.lon, iconFor(kind), `pin ${kind}`, `${item.name}<br>${item.type}`));
      setSuggestionStatus(items.length ? `Found ${items.length} ${labelFor(kind)}.` : `No ${labelFor(kind)} found near the route.`);
    } catch (error) {
      setSuggestionStatus(error instanceof Error ? error.message : "Could not load suggestions.");
    }
  }

  function clearMap() {
    groupsRef.current.route?.clearLayers();
    groupsRef.current.suggestions?.clearLayers();
    routeGeometryRef.current = [];
    setSuggestions([]);
  }

  const costs = useMemo(() => {
    const kmValue = distance / 1000;
    const units = kmValue * costInputs.consumption / 100;
    return { kmValue, units, cost: units * costInputs.price, stops: costInputs.range ? Math.max(0, Math.ceil(kmValue / costInputs.range) - 1) : 0 };
  }, [distance, costInputs]);

  if (!user) {
    return (
      <main className="auth">
        <section className="auth-card">
          <div className="brand">
            <div className="mark">TP</div>
            <div>
              <h1>Travel Planner</h1>
              <p>Plan routes, stops, hotels, food, fuel, and EV charging.</p>
            </div>
          </div>
          <form className="form" onSubmit={auth}>
            <label>Email<input name="email" type="email" placeholder="you@example.com" /></label>
            <label>Password<input name="password" type="password" placeholder="At least 6 characters" /></label>
            {authMode === "register" && <label>Name<input name="name" placeholder="Your name" /></label>}
            <div className="row">
              <button className="primary" type="submit">{authMode === "login" ? "Log in" : "Create account"}</button>
              <button type="button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
                {authMode === "login" ? "Create account" : "Use login"}
              </button>
              <button type="button" onClick={demoLogin}>Try demo</button>
            </div>
            <p className="status">{authMessage}</p>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <div className="mark">TP</div>
          <div>
            <h1>Travel Planner</h1>
            <p>{user.name} · {user.email}</p>
          </div>
        </div>
        <nav className="tabs">
          {["trips", "planner", "places", "costs"].map((item) => (
            <button key={item} aria-selected={view === item} onClick={() => setView(item)}>{title(item)}</button>
          ))}
        </nav>
        <button onClick={logout}>Log out</button>
      </header>
      <section className="workspace">
        <div className="map-wrap">
          <div id="map" />
          <div className="layer-panel">
            <h3>Map layers</h3>
            {Object.entries(layers).map(([key, value]) => (
              <label className="switch-row" key={key}>
                <span>{title(key)}</span>
                <input type="checkbox" checked={value} onChange={(event) => setLayers({ ...layers, [key]: event.target.checked })} />
              </label>
            ))}
          </div>
        </div>
        <aside className="panel">
          {view === "trips" && (
            <section className="card">
              <div className="title-line"><h2>Trips</h2><button className="primary" onClick={() => { setActiveId(""); setView("planner"); }}>New trip</button></div>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search trips" />
              <div className="trip-list">
                {filteredTrips.length ? filteredTrips.map((trip) => (
                  <article className={`trip-card ${trip.id === activeId ? "selected" : ""}`} key={trip.id}>
                    <h3>{trip.name}</h3>
                    <p>{trip.origin || "No origin"} → {trip.destination || "No destination"} · {trip.vehicle}</p>
                    <div className="row">
                      <button className="primary" onClick={() => { setActiveId(trip.id); setView("planner"); mapTrip(trip); }}>Open</button>
                      <button className="danger" onClick={() => deleteTrip(trip.id)}>Delete</button>
                    </div>
                  </article>
                )) : <p className="status">No trips yet. Create your first route.</p>}
              </div>
            </section>
          )}
          {view === "planner" && (
            <section className="card">
              <h2>Planner</h2>
              <form className="form" key={activeTrip?.id || "new-trip"} onSubmit={saveTrip}>
                <label>Trip name<input name="name" defaultValue={activeTrip?.name || ""} placeholder="London to Bradford" /></label>
                <div className="grid-2">
                  <label>Start<input name="origin" defaultValue={activeTrip?.origin || ""} placeholder="London" /></label>
                  <label>Destination<input name="destination" defaultValue={activeTrip?.destination || ""} placeholder="Bradford BD5 8LD" /></label>
                </div>
                <label>Vehicle<select name="vehicle" defaultValue={activeTrip?.vehicle || "petrol"}><option>petrol</option><option>diesel</option><option>electric</option></select></label>
                <label>Waypoints<textarea name="waypoints" defaultValue={activeTrip?.waypoints.map((p) => p.name).join("\n") || ""} /></label>
                <label>Ideas and notes<textarea name="ideas" defaultValue={activeTrip?.ideas.map((p) => p.name).join("\n") || ""} /></label>
                <div className="row">
                  <button className="primary" type="submit">Save and map</button>
                  {activeTrip && <button type="button" className="danger" onClick={() => deleteTrip(activeTrip.id)}>Delete trip</button>}
                </div>
              </form>
              <p className="status">{status}</p>
            </section>
          )}
          {view === "places" && (
            <section className="card">
              <h2>Places on route</h2>
              <div className="button-grid">
                {["food", "hotel", "fuel", "ev"].map((kind) => <button key={kind} onClick={() => findSuggestions(kind)}>{title(labelFor(kind))}</button>)}
              </div>
              <p className="status">{suggestionStatus}</p>
              <div className="suggestions">
                {suggestions.map((item) => <article className="suggestion-card" key={item.id}><h3>{item.name}</h3><p>{item.type} · {Math.round(item.distance)} m from route</p></article>)}
              </div>
            </section>
          )}
          {view === "costs" && (
            <section className="card">
              <h2>Costs</h2>
              <div className="grid-2">
                <label>Consumption<input type="number" value={costInputs.consumption} onChange={(e) => setCostInputs({ ...costInputs, consumption: Number(e.target.value) })} /></label>
                <label>Unit price<input type="number" value={costInputs.price} onChange={(e) => setCostInputs({ ...costInputs, price: Number(e.target.value) })} /></label>
                <label>Range<input type="number" value={costInputs.range} onChange={(e) => setCostInputs({ ...costInputs, range: Number(e.target.value) })} /></label>
              </div>
              <div className="metrics">
                <Metric label="Distance" value={`${Math.round(costs.kmValue).toLocaleString()} km`} />
                <Metric label="Fuel / energy" value={Math.round(costs.units).toLocaleString()} />
                <Metric label="Cost" value={costs.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
                <Metric label="Likely stops" value={String(costs.stops)} />
              </div>
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><b>{value}</b><span>{label}</span></div>;
}

function lines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (window.__leafletLoading) return window.__leafletLoading;
  window.__leafletLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-leaflet="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L));
      existing.addEventListener("error", () => reject(new Error("Leaflet failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.dataset.leaflet = "true";
    script.onload = () => window.L ? resolve(window.L) : reject(new Error("Leaflet loaded without exposing L"));
    script.onerror = () => reject(new Error("Leaflet failed to load"));
    document.head.appendChild(script);
  });
  return window.__leafletLoading;
}

function title(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function ukHint(places: string[]) {
  return /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i.test(places.join(" "));
}

function normalisePostcode(value: string) {
  return value.replace(/\b([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})\b/gi, "$1 $2");
}

async function geocode(place: string, country: string) {
  const suffix = country ? `&countrycodes=${country}` : "";
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(normalisePostcode(place))}${suffix}`);
  const data = await res.json();
  if (!data.length) throw new Error(`Could not find ${place}.`);
  return { name: place, label: data[0].display_name, lat: Number(data[0].lat), lon: Number(data[0].lon) };
}

async function osrm(coords: string) {
  const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`);
  const data = await res.json();
  if (!data.routes?.[0]) throw new Error("Could not build a road route.");
  return data.routes[0];
}

function addMarker(L: LeafletApi, group: any, lat: number, lon: number, label: string, className: string, popup: string) {
  const icon = L.divIcon({ className: "", html: `<div class="${className}">${label}</div>`, iconSize: [24, 24], iconAnchor: [12, 12] });
  const marker = L.marker([lat, lon], { icon }).bindPopup(popup);
  marker.addTo(group);
}

function sampleRoute(points: { lat: number; lon: number }[]) {
  if (points.length <= 6) return points;
  return [0, .2, .4, .6, .8, 1].map((ratio) => points[Math.round((points.length - 1) * ratio)]);
}

function overpass(points: { lat: number; lon: number }[], kind: string) {
  const tags: Record<string, string[]> = {
    food: ['amenity="restaurant"', 'amenity="cafe"', 'amenity="fast_food"', 'amenity="pub"'],
    hotel: ['tourism="hotel"', 'tourism="guest_house"', 'tourism="hostel"'],
    fuel: ['amenity="fuel"'],
    ev: ['amenity="charging_station"']
  };
  const clauses = points.flatMap((point) => (tags[kind] || tags.food).flatMap((tag) => [
    `node[${tag}](around:1800,${point.lat},${point.lon});`,
    `way[${tag}](around:1800,${point.lat},${point.lon});`
  ]));
  return `[out:json][timeout:20];(${clauses.join("")});out center tags 40;`;
}

function normaliseSuggestion(el: any, kind: string) {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) return null;
  const tags = el.tags || {};
  return {
    id: `${el.type}-${el.id}`,
    kind,
    name: tags.name || tags.brand || tags.operator || labelFor(kind),
    type: tags.cuisine || tags.amenity || tags.tourism || kind,
    lat: Number(lat),
    lon: Number(lon),
    address: [tags["addr:street"], tags["addr:city"], tags["addr:postcode"]].filter(Boolean).join(", "),
    distance: 0
  };
}

function nearestDistance(item: Suggestion, route: { lat: number; lon: number }[]) {
  return Math.min(...route.filter((_, index) => index % 10 === 0).map((point) => haversine(item, point)));
}

function haversine(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function km(meters: number) {
  return `${Math.round(meters / 1000).toLocaleString()} km`;
}

function hours(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}

function labelFor(kind: string) {
  return ({ food: "food places", hotel: "hotels", fuel: "fuel stops", ev: "EV chargers" } as Record<string, string>)[kind] || "places";
}

function iconFor(kind: string) {
  return ({ food: "F", hotel: "H", fuel: "P", ev: "E" } as Record<string, string>)[kind] || "P";
}
