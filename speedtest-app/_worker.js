const LOGO_SVG = `<svg width="86" height="85" viewBox="0 0 86 85" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.97156 77.5549L78.6823 6.84416C40.9784 46.8334 26.0874 61.7579 37.4667 76.1661C25.2931 68.0038 20.0318 69.4808 7.97156 77.5549Z" fill="#EAEAEA"/>
<path d="M78.6822 6.84407L7.97156 77.5548C45.6754 37.5656 60.5664 22.641 49.1871 8.23281C61.3607 16.3951 66.622 14.9182 78.6822 6.84407Z" fill="#EAEAEA"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M50.1323 11.5483C38.4059 8.73493 25.5678 12.6745 17.5153 22.7152C10.0066 32.078 8.57993 44.3506 12.7129 54.7508C21.7798 55.5894 32.9597 50.1119 41.1528 39.8959C48.5438 30.68 51.6428 19.9287 50.1323 11.5483ZM37.5649 74.5831C48.569 76.2972 60.1659 72.2339 67.6401 62.9143C75.6526 52.9234 76.7396 39.6191 71.5358 28.8122C63.0544 29.2016 53.2886 34.5544 45.9313 43.7282C37.7798 53.8924 34.849 65.9241 37.5649 74.5831Z" fill="#EAEAEA"/>
</svg>`;

const CSP = [
  "default-src 'none'",
  "img-src 'self' data:",
  "style-src 'unsafe-inline'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

const CAR_DATA_URL = "https://raw.githubusercontent.com/super-android/tunelab/main/cars.json";
const OWNER_KEY = "tl_v1_owner";
const ENTITLEMENTS_COOKIE = "lt_entitlements";
const COMPLETED_SESSIONS_LIMIT = 20;
const PRODUCTS = {
  paintlab: { label: "PaintLab unlock", price: 299, tokens: 0, paint: true },
  tunes_10: { label: "10 LinjeTune credits", price: 199, tokens: 10, paint: false },
  tunes_25: { label: "25 LinjeTune credits", price: 399, tokens: 25, paint: false },
  tunes_60: { label: "60 LinjeTune credits", price: 799, tokens: 60, paint: false },
};

function page() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Linje</title><style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.08),transparent 24rem),linear-gradient(180deg,#050608 0%,#090a0d 52%,#030406 100%);color:#f5f5f7;font-family:Inter,Arial,sans-serif;padding:32px}.grid{position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:72px 72px;mask-image:radial-gradient(circle at center,#000 0%,transparent 74%);animation:drift 22s linear infinite}.wrap{position:relative;width:min(420px,calc(100vw - 48px));display:grid;place-items:center;gap:26px;text-align:center;filter:drop-shadow(0 32px 90px rgba(0,0,0,.5))}.mark-wrap{position:relative;width:min(300px,calc(100vw - 72px));aspect-ratio:1;display:grid;place-items:center}.orbit{position:absolute;border-radius:999px;border:1px dashed rgba(255,255,255,.22)}.outer{inset:0;animation:spin 18s linear infinite}.middle{inset:14%;border-color:rgba(94,160,255,.25);animation:spin 13s linear infinite reverse}.inner{inset:28%;border-color:rgba(168,137,255,.28);animation:spin 9s linear infinite}.mark{width:42%;height:42%;display:grid;place-items:center}.mark img{width:52%;height:52%;filter:drop-shadow(0 0 10px rgba(255,255,255,.28)) drop-shadow(0 0 24px rgba(255,255,255,.16))}.status{font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:rgba(245,245,247,.58)}.tool-link{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 22px;border:1px solid rgba(255,255,255,.24);border-radius:8px;background:rgba(255,255,255,.08);color:#fff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}.tool-link:hover{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.42)}@keyframes spin{to{transform:rotate(360deg)}}@keyframes drift{to{background-position:72px 72px}}</style></head><body><div class="grid"></div><main class="wrap" aria-label="Linje tools"><div class="mark-wrap"><div class="orbit outer"></div><div class="orbit middle"></div><div class="orbit inner"></div><span class="mark"><img src="/logo/logo-icon.svg" alt=""></span></div><div class="status">LinjeTune</div></main></body></html>`;
}

function headers(contentType) {
  return {
    "Content-Type": contentType,
    "Content-Security-Policy": CSP,
    "Cache-Control": "no-store",
    "X-Linje-Upstream": "shelved",
  };
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function parseCookies(request) {
  const cookie = request.headers.get("Cookie") || "";
  return Object.fromEntries(cookie.split(";").map((part) => {
    const index = part.indexOf("=");
    if (index === -1) return null;
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(Boolean));
}

function validOwnerId(ownerId) {
  return /^lt_[a-zA-Z0-9_-]{16,80}$/.test(ownerId || "");
}

function defaultEntitlements() {
  return { paintLabUnlocked: false, tuneTokens: 0, paidTuneAccess: false };
}

function b64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromB64url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(normalized), (char) => char.charCodeAt(0));
}

async function signPayload(payload, env) {
  const secret = env?.LINJETUNE_COOKIE_SECRET || env?.STRIPE_SECRET_KEY || "linjetune-local-cookie-secret";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))));
}

async function encodeEntitlements(state, env) {
  const payload = b64url(new TextEncoder().encode(JSON.stringify(state)));
  return `${payload}.${await signPayload(payload, env)}`;
}

async function decodeEntitlements(raw, env) {
  if (!raw || !raw.includes(".")) return { ...defaultEntitlements(), completedSessions: [] };
  const [payload, signature] = raw.split(".");
  if (signature !== await signPayload(payload, env)) return { ...defaultEntitlements(), completedSessions: [] };
  try {
    const state = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    return {
      ...defaultEntitlements(),
      ...state,
      tuneTokens: Math.max(0, Number(state.tuneTokens) || 0),
      completedSessions: Array.isArray(state.completedSessions) ? state.completedSessions : [],
    };
  } catch {
    return { ...defaultEntitlements(), completedSessions: [] };
  }
}

async function entitlementCookie(state, env) {
  const value = await encodeEntitlements(state, env);
  return `${ENTITLEMENTS_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly`;
}

function publicEntitlements(state) {
  return {
    paintLabUnlocked: !!state.paintLabUnlocked,
    tuneTokens: Math.max(0, Number(state.tuneTokens) || 0),
    paidTuneAccess: Math.max(0, Number(state.tuneTokens) || 0) > 0,
  };
}

async function readEntitlements(request, env) {
  return decodeEntitlements(parseCookies(request)[ENTITLEMENTS_COOKIE], env);
}

function formBody(params) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) body.set(key, String(value));
  return body;
}

async function createCheckout(request, env) {
  const ownerId = parseCookies(request)[OWNER_KEY];
  if (!validOwnerId(ownerId)) return json({ error: "Missing LinjeTune owner id" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const product = PRODUCTS[body.productId];
  if (!product) return json({ error: "Unknown product" }, { status: 400 });
  if (!env?.STRIPE_SECRET_KEY) return json({ error: "Checkout unavailable" }, { status: 503 });

  const url = new URL(request.url);
  const params = formBody({
    mode: "payment",
    success_url: `${url.origin}/api/linjetune/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: url.origin,
    "adaptive_pricing[enabled]": "true",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "gbp",
    "line_items[0][price_data][unit_amount]": product.price,
    "line_items[0][price_data][product_data][name]": product.label,
    "metadata[ownerId]": ownerId,
    "metadata[productId]": body.productId,
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return json({ error: data.error?.message || "Checkout unavailable" }, { status: 502 });
  return json({ url: data.url });
}

async function completeCheckout(request, env) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id") || "";
  if (!env?.STRIPE_SECRET_KEY || !sessionId.startsWith("cs_")) return Response.redirect(url.origin, 303);

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  });
  const session = await response.json().catch(() => ({}));
  const productId = session?.metadata?.productId;
  const ownerId = session?.metadata?.ownerId;
  const product = PRODUCTS[productId];
  const paid = session?.payment_status === "paid" || session?.payment_status === "no_payment_required";

  const redirect = Response.redirect(url.origin, 303);
  if (!response.ok || !product || !paid || !validOwnerId(ownerId)) return redirect;

  const state = await readEntitlements(request, env);
  if (!state.completedSessions.includes(sessionId)) {
    state.paintLabUnlocked = state.paintLabUnlocked || product.paint;
    state.tuneTokens = Math.max(0, Number(state.tuneTokens) || 0) + product.tokens;
    state.completedSessions = [sessionId, ...state.completedSessions].slice(0, COMPLETED_SESSIONS_LIMIT);
  }
  redirect.headers.append("Set-Cookie", `${OWNER_KEY}=${encodeURIComponent(ownerId)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);
  redirect.headers.append("Set-Cookie", await entitlementCookie(state, env));
  return redirect;
}

async function consumeToken(request, env) {
  const ownerId = parseCookies(request)[OWNER_KEY];
  if (!validOwnerId(ownerId)) return json({ error: "Missing LinjeTune owner id" }, { status: 400 });
  const state = await readEntitlements(request, env);
  if ((state.tuneTokens || 0) < 1) return json({ error: "No tune credits remaining" }, { status: 402 });
  state.tuneTokens -= 1;
  const response = json(publicEntitlements(state));
  response.headers.append("Set-Cookie", await entitlementCookie(state, env));
  return response;
}

async function handleLinjeTuneApi(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/api/linjetune/entitlements" && request.method === "GET") {
    return json(publicEntitlements(await readEntitlements(request, env)));
  }
  if (url.pathname === "/api/linjetune/checkout" && request.method === "POST") {
    return createCheckout(request, env);
  }
  if (url.pathname === "/api/linjetune/complete" && request.method === "GET") {
    return completeCheckout(request, env);
  }
  if (url.pathname === "/api/linjetune/consume-token" && request.method === "POST") {
    return consumeToken(request, env);
  }
  if (url.pathname === "/api/billing/webhook" && request.method === "POST") {
    return json({ received: true });
  }
  return json({ error: "Not found" }, { status: 404 });
}

async function serveTuneApp(request, env) {
  if (env?.ASSETS) {
    const spaUrl = new URL("/tunelab/", request.url);
    const response = await env.ASSETS.fetch(new Request(spaUrl, request));
    if (response.status !== 404) return response;
  }

  return new Response(page(), {
    status: 200,
    headers: headers("text/html; charset=utf-8"),
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return serveTuneApp(request, env);
    }

    if (url.pathname.startsWith("/api/linjetune/") || url.pathname === "/api/billing/webhook") {
      return handleLinjeTuneApi(request, env);
    }

    if (url.pathname === "/tunelab") {
      return Response.redirect(url.origin, 308);
    }

    if (url.pathname === "/tunelab/data/cars.json") {
      try {
        const upstream = await fetch(CAR_DATA_URL, {
          headers: { "Accept": "application/json" },
          cf: { cacheEverything: true, cacheTtl: 300 },
        });
        if (upstream.ok) {
          return new Response(upstream.body, {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Cache-Control": "public, max-age=300",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } catch {}

      if (env?.ASSETS) {
        const fallback = await env.ASSETS.fetch(request);
        if (fallback.status !== 404) return fallback;
      }
    }

    if (url.pathname.startsWith("/tunelab/") && env?.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) return assetResponse;

      const spaUrl = new URL("/tunelab/", request.url);
      return env.ASSETS.fetch(new Request(spaUrl, request));
    }

    if (url.pathname === "/logo/logo-icon.svg") {
      return new Response(LOGO_SVG, {
        status: 200,
        headers: headers("image/svg+xml; charset=utf-8"),
      });
    }

    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ ok: false, status: "shelved" }), {
        status: 503,
        headers: headers("application/json; charset=utf-8"),
      });
    }

    if (request.method === "GET" || request.method === "HEAD") {
      return new Response(page(), {
        status: 200,
        headers: headers("text/html; charset=utf-8"),
      });
    }

    return new Response("Linje is shelved", {
      status: 503,
      headers: headers("text/plain; charset=utf-8"),
    });
  },
};
