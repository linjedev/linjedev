import { NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const name = String(body.name || email.split("@")[0] || "Traveller").trim();
  if (!email.includes("@") || password.length < 6) {
    return NextResponse.json({ error: "Use an email and a password of at least 6 characters." }, { status: 400 });
  }
  try {
    const user = await prisma.user.create({
      data: { email, name, passwordHash: hashPassword(password) }
    });
    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch {
    return NextResponse.json({ error: "That email is already registered." }, { status: 409 });
  }
}
