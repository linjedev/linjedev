import { NextResponse } from "next/server";

const DEFAULT_ALLOWED_ORIGINS = new Set([
    "https://marketplace.worldwideview.dev",
    "https://app.worldwideview.dev",
    "https://worldwideview.dev",
    "https://linje.dev",
]);

function configuredOrigins(): Set<string> {
    const origins = new Set(DEFAULT_ALLOWED_ORIGINS);
    const raw = process.env.MARKETPLACE_CORS_ORIGINS ?? process.env.NEXT_PUBLIC_MARKETPLACE_URL ?? "";
    raw.split(",").map((item) => item.trim()).filter(Boolean).forEach((origin) => origins.add(origin));
    return origins;
}

function isLocalDevOrigin(origin: string): boolean {
    try {
        const url = new URL(origin);
        return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    } catch {
        return false;
    }
}

/** Build CORS headers for the marketplace bridge API. */
export function corsHeaders(request: Request): Record<string, string> {
    const origin = request.headers.get("origin");

    // If there is no origin, no CORS headers are needed
    if (!origin) return {};

    if (!configuredOrigins().has(origin) && !isLocalDevOrigin(origin)) return {};

    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-marketplace-ping",
        ...(isLocalDevOrigin(origin) ? { "Access-Control-Allow-Private-Network": "true" } : {}),
        "Access-Control-Max-Age": "86400",
    };
}

/** Standard preflight response. */
export function handlePreflight(request: Request): NextResponse {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(request),
    });
}

/** Wrap a NextResponse with CORS headers. */
export function withCors(response: NextResponse, request: Request): NextResponse {
    const headers = corsHeaders(request);
    for (const [key, value] of Object.entries(headers)) {
        response.headers.set(key, value);
    }
    return response;
}
