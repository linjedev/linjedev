import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getLinjeTuneEntitlements, isValidLinjeTuneOwnerId } from "@/lib/linjetune/entitlements";

export async function GET() {
  const ownerId = (await cookies()).get("tl_v1_owner")?.value;
  if (!isValidLinjeTuneOwnerId(ownerId)) {
    return NextResponse.json({
      paintLabUnlocked: false,
      tuneTokens: 0,
      paidTuneAccess: false,
    });
  }

  try {
    return NextResponse.json(await getLinjeTuneEntitlements(ownerId));
  } catch (error) {
    console.error("[linjetune] entitlement read failed", error);
    return NextResponse.json({
      paintLabUnlocked: false,
      tuneTokens: 0,
      paidTuneAccess: false,
    });
  }
}
