import { NextRequest, NextResponse } from "next/server";
import { isAuthEnabled } from "@/core/edition";
import { auth } from "@/lib/auth";
import { getClientIp } from "@/lib/rateLimit";
import { linjeTuneBrowserLimiter } from "@/lib/rateLimiters";
import { safeFetch } from "@/lib/security/ssrf";

const MAX_BROWSER_RESPONSE_BYTES = 2 * 1024 * 1024;
const BROWSER_FETCH_TIMEOUT_MS = 10_000;
const WEB_PREVIEW_CONTENT_TYPES = [
    "text/html",
    "text/plain",
    "application/json",
    "application/xhtml+xml",
    "application/xml",
];

function isWebPreviewContent(contentType: string): boolean {
    const normalized = contentType.toLowerCase();
    return WEB_PREVIEW_CONTENT_TYPES.some((type) => normalized.includes(type));
}

function browserHeaders(targetUrl: string): HeadersInit {
    return {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy": [
            "default-src 'self' http: https: data: blob:",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https:",
            "style-src 'self' 'unsafe-inline' http: https:",
            "img-src 'self' http: https: data: blob:",
            "media-src 'self' http: https: data: blob:",
            "frame-ancestors 'self'",
        ].join("; "),
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "X-LinjeTune-Preview-URL": targetUrl,
    };
}

function injectBaseTag(html: string, targetUrl: string): string {
    const escaped = targetUrl
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    const baseTag = `<base href="${escaped}">`;

    if (/<head[\s>]/i.test(html)) {
        return html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
    }

    return `${baseTag}${html}`;
}

export async function GET(req: NextRequest) {
    const rateLimited = linjeTuneBrowserLimiter.check(getClientIp(req));
    if (rateLimited) return rateLimited;

    if (isAuthEnabled) {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const targetUrl = req.nextUrl.searchParams.get("url");
    if (!targetUrl) {
        return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
    }

    try {
        const upstream = await safeFetch(targetUrl, {
            headers: {
                "User-Agent": "LinjeTune/1.0",
                Accept: "text/html,application/xhtml+xml,application/xml,text/plain,application/json;q=0.9,*/*;q=0.5",
            },
            maxSize: MAX_BROWSER_RESPONSE_BYTES,
            timeout: BROWSER_FETCH_TIMEOUT_MS,
        });

        if (!upstream.ok) {
            return NextResponse.json(
                { error: `Upstream returned ${upstream.status}` },
                { status: upstream.status },
            );
        }

        const contentType = upstream.headers.get("content-type") || "text/html";
        if (!isWebPreviewContent(contentType)) {
            return NextResponse.json(
                { error: "Unsupported content type for LinjeTune browser preview" },
                { status: 415 },
            );
        }

        const body = await upstream.text();
        const html = contentType.toLowerCase().includes("text/html")
            || contentType.toLowerCase().includes("application/xhtml+xml")
            ? injectBaseTag(body, targetUrl)
            : `<pre>${body
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")}</pre>`;

        return new Response(html, {
            status: 200,
            headers: browserHeaders(targetUrl),
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to load preview";
        const status = message.includes("SSRF Error") ? 403 : 502;
        return NextResponse.json({ error: message }, { status });
    }
}
