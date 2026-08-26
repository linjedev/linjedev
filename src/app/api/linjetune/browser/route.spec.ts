import {
    beforeEach, describe, expect, it, vi
} from "vitest";
import type { Session } from "next-auth";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { safeFetch } from "@/lib/security/ssrf";
import { GET } from "./route";

const authState = vi.hoisted(() => ({
    isAuthEnabled: true,
}));

vi.mock("@/core/edition", () => ({
    get isAuthEnabled() {
        return authState.isAuthEnabled;
    },
}));

vi.mock("@/lib/auth", () => ({
    auth: vi.fn(),
}));

vi.mock("@/lib/security/ssrf", () => ({
    safeFetch: vi.fn(),
}));

vi.mock("@/lib/rateLimiters", () => ({
    linjeTuneBrowserLimiter: { check: vi.fn().mockReturnValue(null) },
}));

vi.mock("@/lib/rateLimit", () => ({
    getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

const mockAuth = vi.mocked(auth as unknown as () => Promise<Session | null>);
const mockSafeFetch = vi.mocked(safeFetch);

function request(url: string): NextRequest {
    return new NextRequest(url);
}

describe("GET /api/linjetune/browser", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        authState.isAuthEnabled = true;
        mockAuth.mockResolvedValue({
            user: { id: "user-123", email: "driver@example.com" },
        } as Session);
    });

    it("requires an authenticated session when auth is enabled", async () => {
        mockAuth.mockResolvedValue(null);

        const response = await GET(request("http://localhost/api/linjetune/browser?url=https%3A%2F%2Fexample.com"));

        expect(response.status).toBe(401);
        expect(mockSafeFetch).not.toHaveBeenCalled();
    });

    it("returns 400 when the url parameter is missing", async () => {
        const response = await GET(request("http://localhost/api/linjetune/browser"));

        expect(response.status).toBe(400);
        expect(mockSafeFetch).not.toHaveBeenCalled();
    });

    it("proxies allowlisted HTML through safeFetch and injects a base tag", async () => {
        mockSafeFetch.mockResolvedValue(new Response("<html><head></head><body>Hello</body></html>", {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
        }));

        const target = "https://docs.example.com/page";
        const response = await GET(request(`http://localhost/api/linjetune/browser?url=${encodeURIComponent(target)}`));
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain(`<base href="${target}">`);
        expect(mockSafeFetch).toHaveBeenCalledWith(target, expect.objectContaining({
            maxSize: 2 * 1024 * 1024,
            timeout: 10_000,
        }));
    });

    it("returns 415 for non-web content", async () => {
        mockSafeFetch.mockResolvedValue(new Response("binary", {
            status: 200,
            headers: { "content-type": "application/octet-stream" },
        }));

        const response = await GET(request("http://localhost/api/linjetune/browser?url=https%3A%2F%2Fexample.com%2Ffile.bin"));

        expect(response.status).toBe(415);
    });

    it("returns 403 when the shared SSRF guard rejects the target", async () => {
        mockSafeFetch.mockRejectedValue(new Error("SSRF Error: Host is not in PROXY_HOST_ALLOWLIST."));

        const response = await GET(request("http://localhost/api/linjetune/browser?url=https%3A%2F%2Fblocked.example.com"));

        expect(response.status).toBe(403);
    });
});
