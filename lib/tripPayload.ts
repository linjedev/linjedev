import type { Place, Trip } from "@prisma/client";

export function toTripPayload(trip: Trip & { places: Place[] }) {
  return {
    id: trip.id,
    name: trip.name,
    origin: trip.origin,
    destination: trip.destination,
    vehicle: trip.vehicle,
    routeData: JSON.parse(trip.routeJson || "{}"),
    waypoints: trip.places
      .filter((place) => place.kind === "waypoint")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((place) => ({ id: place.id, name: place.name, note: place.note })),
    ideas: trip.places
      .filter((place) => place.kind === "idea")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((place) => ({ id: place.id, name: place.name, note: place.note })),
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt
  };
}
