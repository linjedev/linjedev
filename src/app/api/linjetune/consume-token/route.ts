import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { consumeLinjeTuneToken, isValidLinjeTuneOwnerId } from "@/lib/linjetune/entitlements";

export async function POST() {
  const ownerId = (await cookies()).get("tl_v1_owner")?.value;
  if (!isValidLinjeTuneOwnerId(ownerId)) {
    return NextResponse.json({ error: "Missing LinjeTune owner id" }, { status: 400 });
  }

  try {
    return NextResponse.json(await consumeLinjeTuneToken(ownerId));
  } catch (error) {
    if (error instanceof Error && error.message === "NO_TUNE_TOKENS") {
      return NextResponse.json({ error: "No tune credits remaining" }, { status: 402 });
    }
    console.error("[linjetune] token consume failed", error);
    return NextResponse.json({ error: "Unable to consume tune credit" }, { status: 500 });
  }
}
