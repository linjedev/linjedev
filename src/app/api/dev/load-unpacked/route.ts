import { NextResponse } from "next/server";
import { validateManifest } from "@/core/plugins/validateManifest";
import { parseWwvManifest } from "@/core/plugins/parseWwvManifest";

function devCorsHeaders(request: Request): Record<string, string> {
    const origin = request.headers.get("origin") ?? "";
    const allowedOrigin = (() => {
        try {
            const url = new URL(origin);
            return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
        } catch {
            return false;
        }
    })();

    return allowedOrigin
        ? {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
        : {};
}

export async function OPTIONS(request: Request) {
    if (process.env.NODE_ENV !== "development") {
        return new NextResponse(null, { status: 403 });
    }

    // Allows the WWV CLI (running on a different port) to hit this endpoint
    return new NextResponse(null, {
        status: 204,
        headers: devCorsHeaders(request),
    });
}

/**
 * POST /api/dev/load-unpacked
 *
 * Called by the `@worldwideview/cli` dev server when it starts.
 * It sends the `wwv-manifest.json` + `devUrl` (the CLI dev server URL).
 */
export async function POST(request: Request) {
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json(
            { error: "Developer mode is only available in development environments" },
            { status: 403 }
        );
    }

    const corsHeaders = devCorsHeaders(request);

    try {
        const body = await request.json();

        // Convert wwv-manifest.json format to PluginManifest format
        const manifest = parseWwvManifest(body);

        // Dev-loaded plugins are unverified by default
        manifest.trust = "unverified";

        const validation = validateManifest(manifest);
        if (!validation.valid) {
            return NextResponse.json(
                { error: "Invalid manifest", details: validation.errors },
                { status: 400, headers: corsHeaders }
            );
        }

        return NextResponse.json(
            { status: "loaded", manifest },
            { status: 200, headers: corsHeaders }
        );
    } catch (err) {
        console.error("[Load Unpacked] Error:", err);
        return NextResponse.json(
            { error: "Failed to parse or load unpacked manifest" },
            { status: 500, headers: corsHeaders }
        );
    }
}
