import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toTripPayload } from "@/lib/tripPayload";
import { toPlaces } from "@/lib/places";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json();
  const owned = await prisma.trip.findFirst({ where: { id, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  const trip = await prisma.$transaction(async (tx) => {
    await tx.place.deleteMany({ where: { tripId: id } });
    return tx.trip.update({
      where: { id },
      data: {
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
  });
  return NextResponse.json({ trip: toTripPayload(trip) });
}

export async function DELETE(_request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });
  const { id } = await context.params;
  const owned = await prisma.trip.findFirst({ where: { id, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  await prisma.trip.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
