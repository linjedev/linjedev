import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAuthEnabled } from "@/core/edition";
import { getClientIp, placesLimiter } from "@/lib/rateLimiters";
import { transliterate } from "@/lib/utils/transliterate";

// Server-side cache: keyed by normalised input, 1-hour TTL
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_INPUT_LENGTH = 160;

interface GooglePlacePrediction {
    description?: string;
    place_id?: string;
    structured_formatting?: {
        main_text?: string;
        secondary_text?: string;
    };
    types?: string[];
}

interface GoogleAutocompleteResponse {
    status?: string;
    predictions?: GooglePlacePrediction[];
    error_message?: string;
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
    const input = searchParams.get("input")?.trim() ?? "";

    if (!input) {
        return NextResponse.json({ error: "Input is required" }, { status: 400 });
    }
    if (input.length > MAX_INPUT_LENGTH) {
        return NextResponse.json({ error: "Input is too long" }, { status: 413 });
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
    const cacheKey = `${cachePrefix}${input.toLowerCase().trim()}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
        return NextResponse.json(cached.data);
    }

    try {
        // No type restriction — returns addresses, establishments, landmarks, regions, etc.
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            input
        )}&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json() as GoogleAutocompleteResponse;

        if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
            console.error("Google Places API Error:", data.status, data.error_message);
            return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 });
        }

        const predictions = (data.predictions ?? [])
            .filter((p) => typeof p.place_id === "string" && p.place_id.length > 0)
            .map((p) => ({
                description: transliterate(p.description ?? ""),
                placeId: p.place_id as string,
                mainText: transliterate(p.structured_formatting?.main_text || p.description || ""),
                secondaryText: transliterate(p.structured_formatting?.secondary_text || ""),
                types: p.types ?? [],
            }));

        const result = { predictions };
        cache.set(cacheKey, { data: result, expiresAt: Date.now() + TTL_MS });
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in Places Autocomplete route:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
