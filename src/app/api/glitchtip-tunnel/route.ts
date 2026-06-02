import { NextRequest, NextResponse } from "next/server";
import { getClientIp, telemetryTunnelLimiter } from "@/lib/rateLimiters";

const MAX_ENVELOPE_BYTES = 256 * 1024;

export async function POST(req: NextRequest) {
  const rateLimited = telemetryTunnelLimiter.check(getClientIp(req));
  if (rateLimited) return rateLimited;

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_ENVELOPE_BYTES) {
    return NextResponse.json({ status: "error", message: "Payload too large" }, { status: 413 });
  }

  const serverUrl = process.env.GLITCHTIP_SERVER_URL;
  const projectId = process.env.GLITCHTIP_PROJECT_ID;
  const secretKey = process.env.GLITCHTIP_SECRET_KEY;

  if (!serverUrl || !projectId || !secretKey) {
    return NextResponse.json({ status: "error", message: "GlitchTip tunnel configuration missing" }, { status: 500 });
  }

  const url = `${serverUrl}/api/${projectId}/envelope/?sentry_version=7&sentry_key=${secretKey}&sentry_client=sentry.javascript.nextjs`;

  try {
    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_ENVELOPE_BYTES) {
      return NextResponse.json({ status: "error", message: "Payload too large" }, { status: 413 });
    }
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
        Accept: "*/*",
      },
      body: rawBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GlitchTip tunnel rejected payload:", response.status, errorText);
      return NextResponse.json({ status: "error", message: "GlitchTip rejected payload" }, { status: response.status });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: unknown) {
    console.error("GlitchTip tunnel internal error:", error);
    return NextResponse.json({ status: "error", message: "Tunnel relay failed" }, { status: 500 });
  }
}
