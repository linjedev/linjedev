import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeFetch } from "@/lib/security/ssrf";

const BALTIC_LIVE_CAM_HOST = "balticlivecam.com";

function isBalticLiveCamUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "https:" && (url.hostname === BALTIC_LIVE_CAM_HOST || url.hostname.endsWith(`.${BALTIC_LIVE_CAM_HOST}`));
    } catch {
        return false;
    }
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetUrl = req.nextUrl.searchParams.get("url");
    if (!targetUrl) {
        return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
    }

    try {
        if (isBalticLiveCamUrl(targetUrl)) {
            const response = await safeFetch(targetUrl, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
                maxSize: 2 * 1024 * 1024,
                timeout: 10000,
            });
            const html = await response.text();

            const idMatch = html.match(/id:\s*(\d+)/);
            if (!idMatch) {
                return NextResponse.json({ error: "Could not find camera ID on balticlivecam" }, { status: 400 });
            }
            const cameraId = idMatch[1];

            const ajaxUrl = `https://balticlivecam.com/wp-admin/admin-ajax.php?action=auth_token&id=${cameraId}&embed=1&main_referer=`;
            const ajaxRes = await safeFetch(ajaxUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    Referer: targetUrl
                },
                maxSize: 2 * 1024 * 1024,
                timeout: 10000,
            });
            const ajaxHtml = await ajaxRes.text();

            const streamMatch = ajaxHtml.match(/src:\s*'([^']+m3u8[^']+)'/);
            if (streamMatch && streamMatch[1]) {
                return NextResponse.json({ streamUrl: streamMatch[1] });
            }
                return NextResponse.json({ error: "Could not find m3u8 stream on balticlivecam backend" }, { status: 404 });
        }

        return NextResponse.json({ error: "Unsupported extractor platform" }, { status: 400 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[CameraExtractor] Error:", message);
        return NextResponse.json({ error: "Failed to extract stream" }, { status: 500 });
    }
}
