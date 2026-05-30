import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toTripPayload } from "@/lib/tripPayload";
import { toPlaces } from "@/lib/places";

async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function GET() {
  try {
    const user = await requireUser();
    const trips = await prisma.trip.findMany({
      where: { userId: user.id },
      include: { places: true },
      orderBy: { updatedAt: "desc" }
    });
    return NextResponse.json({ trips: trips.map(toTripPayload) });
  } catch {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const trip = await prisma.trip.create({
      data: {
        userId: user.id,
        name: String(body.name || "Untitled trip").trim(),
        origin: String(body.origin || "").trim(),
        destination: String(body.destination || "").trim(),
        vehicle: String(body.vehicle || "petrol"),
        routeJson: JSON.stringify(body.routeData || {}),
        places: {
          create: [
            ...toPlaces(body.waypoints, "waypoint"),
            ...toPlaces(body.ideas, "idea")
          ]
        }
      },
      include: { places: true }
    });
    return NextResponse.json({ trip: toTripPayload(trip) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }
}
