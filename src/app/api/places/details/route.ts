import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAuthEnabled } from "@/core/edition";
import { getClientIp, placesLimiter } from "@/lib/rateLimiters";
import { transliterate } from "@/lib/utils/transliterate";

// Server-side cache: keyed by place_id, 24-hour TTL (place geometry is stable)
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_PLACE_ID_LENGTH = 256;

interface GooglePlaceDetailsResponse {
    status?: string;
    error_message?: string;
    result?: {
        geometry?: {
            location?: {
                lat?: number;
                lng?: number;
            };
            viewport?: unknown;
        };
        name?: string;
        types?: string[];
    };
}

export async function GET(request: Request) {
    const rateLimited = placesLimiter.check(getClientIp(request));
    if (rateLimited) return rateLimited;

    if (isAuthEnabled) {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("place_id")?.trim() ?? "";

    if (!placeId) {
        return NextResponse.json({ error: "place_id is required" }, { status: 400 });
    }
    if (placeId.length > MAX_PLACE_ID_LENGTH) {
        return NextResponse.json({ error: "place_id is too long" }, { status: 413 });
    }

    // Use user-provided key if present in header AND looks valid, otherwise fall back to .env
    const userKey = request.headers.get("X-User-Google-Key");
    const isValidUserKey = userKey && userKey.length >= 20;
    const apiKey = isValidUserKey ? userKey : process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.error("GOOGLE_MAPS_API_KEY is not defined and no user key provided");
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Separate cache entries for user-provided keys vs default
    const cachePrefix = userKey ? `user:${userKey.slice(0, 8)}:` : "";
    const cacheId = `${cachePrefix}${placeId}`;
    const cached = cache.get(cacheId);
    if (cached && Date.now() < cached.expiresAt) {
        return NextResponse.json(cached.data);
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
            placeId
        )}&fields=geometry,name,types,formatted_address&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json() as GooglePlaceDetailsResponse;

        if (data.status !== "OK") {
            console.error("Google Places Details API Error:", data.status, data.error_message);
            return NextResponse.json({ error: "Failed to fetch place details" }, { status: 500 });
        }

        const location = data.result?.geometry?.location;
        if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
            return NextResponse.json({ error: "No geometry found for place" }, { status: 404 });
        }

        const result = {
            lat: location.lat,
            lon: location.lng,
            name: transliterate(data.result?.name ?? ""),
            types: data.result?.types || [],
            viewport: data.result?.geometry?.viewport || null,
        };
        cache.set(cacheId, { data: result, expiresAt: Date.now() + TTL_MS });
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in Places Details route:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
