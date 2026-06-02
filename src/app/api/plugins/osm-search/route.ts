import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAuthEnabled } from "@/core/edition";
import { getClientIp, osmSearchLimiter } from "@/lib/rateLimiters";

const OVERPASS_MIRRORS = [
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
];

const MAX_QUERY_LENGTH = 8000;
const MIRROR_TIMEOUT_MS = 25_000;

interface OverpassBody {
    query?: unknown;
}

interface OverpassResponse {
    elements?: unknown[];
    osm3s?: unknown;
    remark?: string;
}

async function tryMirror(urlStr: string, query: string, timeoutMs: number) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
    try {
        return await fetch(urlStr, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                "User-Agent": "Linje.track/1.0",
                "X-Linje-Client": "linje.track",
            },
            body: `data=${encodeURIComponent(query)}`,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timer);
    }
}

export async function POST(req: Request) {
    const rateLimited = osmSearchLimiter.check(getClientIp(req));
    if (rateLimited) return rateLimited;

    if (isAuthEnabled) {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const body = await req.json() as OverpassBody;
        const query = typeof body.query === "string" ? body.query.trim() : "";

        if (!query) {
            return NextResponse.json({ error: "Missing query" }, { status: 400 });
        }
        if (query.length > MAX_QUERY_LENGTH) {
            return NextResponse.json({ error: "Query is too large" }, { status: 413 });
        }

        console.log(`[OSMSearchProxy] Querying Overpass API mirrors... (length: ${query.length})`);

        let lastError = null;
        for (const mirror of OVERPASS_MIRRORS) {
            try {
                console.log(`[OSMSearchProxy] Trying mirror: ${mirror}`);
                const res = await tryMirror(mirror, query, MIRROR_TIMEOUT_MS);

                if (res.ok) {
                    const data = await res.json() as OverpassResponse;
                    if (Array.isArray(data.elements)) {
                        return NextResponse.json({
                            data: data.elements,
                            elements: data.elements,
                            osm3s: data.osm3s || null,
                            mirror,
                        });
                    }
                    if (data.remark) {
                         console.warn(`[OSMSearchProxy] ${mirror} returned remark: ${data.remark}`);
                         // If it's a specific query error (remark), don't bother retrying mirrors
                         return NextResponse.json({ error: data.remark }, { status: 400 });
                    }
                } else {
                    const text = await res.text();
                    console.warn(`[OSMSearchProxy] Mirror ${mirror} failed: ${res.status} ${res.statusText}`);
                    lastError = { mirror, status: res.status, statusText: res.statusText, details: text.slice(0, 1000) };
                    // If it's a 4xx error (except 429), it's probably a bad query, so don't retry
                    if (res.status >= 400 && res.status < 500 && res.status !== 406 && res.status !== 429) {
                        break;
                    }
                }
            } catch (err: unknown) {
                console.warn(`[OSMSearchProxy] Mirror ${mirror} threw error:`);
                console.warn(err);
                if (err instanceof Error) console.warn(err.stack);
                lastError = { status: 500, statusText: "Internal Error", details: err instanceof Error ? err.message : String(err) };
            }
        }

        return NextResponse.json(
            { error: "All Overpass mirrors failed or timed out. The OSM servers are likely under heavy load.", lastError },
            { status: 504 }
        );
    } catch (e: unknown) {
        console.error(`[OSMSearchProxy] Internal error:`, e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
