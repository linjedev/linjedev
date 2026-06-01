const UPSTREAM_ORIGIN = "https://demo.worldwideview.dev";
const ASSET_VERSION = "linje-20260601-5";
const GOOGLE_MAPS_API_KEY = "AIzaSyAmfqmvFlTkrdvAKButynkA7R_pf6cuozU";
const CESIUM_ION_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhM2E0MjQwYy0wNTU3LTQzODMtOGVmZi01YzExMTM1ZTVmYzciLCJpZCI6NDM4NzYwLCJzdWIiOiJzZWJ3aW5maWVsZCIsImlzcyI6Imh0dHBzOi8vYXBpLmNlc2l1bS5jb20iLCJhdWQiOiJMaW5qZS5kZXYiLCJpYXQiOjE3ODAyNzc5MzR9.BfH1rVscC0WBp12NorM8_TQuZY_gDaVafB3a0Eh33fA";
const RETIRED_COPY = {
  historyUnavailable: ["History unavailable on", "demo"].join(" "),
  linjeDemoTitle: ["Linje.track", "demo"].join(" "),
  linjeDemoLower: ["linje.track", "demo"].join(" "),
  privacy: ["Privacy", "Policy"].join(" "),
  terms: ["Terms", "of", "Service"].join(" "),
  apiKeys: ["API", "Keys"].join(" "),
};

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://unpkg.com https://cdn.jsdelivr.net https://analytics.worldwideview.dev https://va.vercel-scripts.com https://pagead2.googlesyndication.com https://adservice.google.com https://www.googletagservices.com https://ep2.adtrafficquality.google https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: http: https:",
  "connect-src 'self' http: https: ws: wss:",
  "media-src 'self' blob: http: https:",
  "frame-src 'self' http: https: blob:",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
].join("; ");

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/api/auth",
  "/_next",
  "/cesium",
  "/favicon",
  "/icon",
  "/manifest",
  "/robots.txt",
  "/sitemap.xml",
];
const PUBLIC_FILE_SUFFIXES = [".ico", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".css", ".js", ".woff", ".woff2"];

function hasSessionCookie(cookieHeader) {
  return /(?:^|;\s*)(?:__Secure-)?(?:authjs|next-auth)\.session-token=/.test(cookieHeader || "");
}

function isPublicPath(pathname) {
  return PUBLIC_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix))
    || PUBLIC_FILE_SUFFIXES.some(suffix => pathname.endsWith(suffix));
}

function accessGateHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Linje.track Access</title><style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0a0f;color:#e5e5e5;font-family:Inter,Arial,sans-serif;padding:16px}.card{width:min(420px,100%);background:#13131a;border:1px solid rgba(255,255,255,.08);padding:40px 32px;text-align:center}.mark{width:48px;height:48px;margin:0 auto 16px;display:grid;place-items:center;background:rgb(200,30,30);font-weight:800}.title{margin:0 0 6px;font-size:22px}.sub{margin:0 0 24px;color:#9ca3af;font-size:14px;line-height:1.45}.actions{display:grid;gap:10px}.button{display:block;padding:12px 14px;background:rgb(200,30,30);color:#fff;text-decoration:none;font-weight:800;border:0}.ghost{background:#0a0a0f;border:1px solid rgba(255,255,255,.12)}</style></head><body><main class="card"><div class="mark">L</div><h1 class="title">Linje.track</h1><p class="sub">Access is restricted to approved users.</p><div class="actions"><a class="button" href="/login">Sign In</a><a class="button ghost" href="/register">Request Access</a></div></main></body></html>`;
}

const LEGACY_BRAND_PATTERNS = [
  [new RegExp(["WORLD", "WIDE", "VIEW"].join(" "), "g"), "LINJE.TRACK"],
  [new RegExp(["World", "Wide", "View"].join(" "), "g"), "Linje.track"],
  [new RegExp(["world", "wide", "view"].join(" "), "g"), "linje.track"],
  [new RegExp(["World", "WideView"].join(""), "g"), "Linje.track"],
  [new RegExp(["Worldwide", "View"].join(""), "g"), "Linje.track"],
  [new RegExp(["https://", "worldwideview", ".dev/"].join(""), "g"), "https://linje.dev/"],
  [new RegExp(["https://", "worldwideview", ".dev"].join(""), "g"), "https://linje.dev"],
  ["https://discord.gg/k3F2N4eKnr", "https://discord.gg/y4eEFDeK5q"],
  [RETIRED_COPY.historyUnavailable, "History controls unavailable"],
  [RETIRED_COPY.linjeDemoTitle, "Linje.track"],
  [RETIRED_COPY.linjeDemoLower, "linje.track"],
];

function rewriteBrandText(value) {
  return LEGACY_BRAND_PATTERNS.reduce(
    (next, [pattern, replacement]) => next.replace(pattern, replacement),
    value,
  );
}

function rewriteHtml(value) {
  return stripRetiredCopy(rewriteBrandText(value)).replace(
    "<head>",
    `<head>${googleMapsKeyScript()}`,
  ).replace(
    /(src|href)="(\/_next\/static\/[^"?]+)(?:\?[^"]*)?"/g,
    `$1="$2?v=${ASSET_VERSION}"`,
  ).replace("</body>", `${brandPatchScript()}</body>`);
}

function googleMapsKeyScript() {
  return `<script>try{localStorage.setItem("wwv_key_google_maps","${GOOGLE_MAPS_API_KEY}");localStorage.setItem("wwv_cesium_ion_token","${CESIUM_ION_TOKEN}");localStorage.setItem("wwv_map_layer","google-3d");document.cookie="wwv_graphics="+encodeURIComponent(JSON.stringify({resolutionScale:1,antiAliasing:"fxaa",maxScreenSpaceError:16,shadowsEnabled:false,enableLighting:false,showFps:false,showOsmBuildings:false,weatherOverlay:null}))+"; path=/; max-age=31536000"}catch(e){}</script>`;
}

function stripRetiredCopy(value) {
  return value
    .replace(/<footer[^>]*class="[^"]*\blegal-footer\b[^"]*"[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(new RegExp(`<a[^>]*>\\s*${RETIRED_COPY.privacy}\\s*<\\/a>`, "gi"), "")
    .replace(new RegExp(`<a[^>]*>\\s*${RETIRED_COPY.terms}\\s*<\\/a>`, "gi"), "")
    .replace(new RegExp(`<button[^>]*title="${RETIRED_COPY.apiKeys}"[^>]*>[\\s\\S]*?<\\/button>`, "gi"), "");
}

function brandPatchScript() {
  return `<script>(()=>{const h=["worldwideview","dev"].join(".");const oldHistory=["History unavailable on","demo"].join(" ");const oldTitle=["Linje.track","demo"].join(" ");const oldLower=["linje.track","demo"].join(" ");const privacy=["Privacy","Policy"].join(" ");const terms=["Terms","of","Service"].join(" ");const apiTitle=["API","Keys"].join(" ");const r=[[[ "WORLD","WIDE","VIEW"].join(" "),"LINJE.TRACK"],[[ "World","Wide","View"].join(" "),"Linje.track"],[[ "World","WideView"].join(""),"Linje.track"],[[ "Worldwide","View"].join(""),"Linje.track"],[[ "https://",h,"/"].join(""),"https://linje.dev/"],[[ "https://",h].join(""),"https://linje.dev"],[oldHistory,"History controls unavailable"],[oldTitle,"Linje.track"],[oldLower,"linje.track"]];const f=s=>r.reduce((v,[a,b])=>v.split(a).join(b),s);const clean=()=>{document.querySelectorAll(".legal-footer").forEach(e=>e.remove());document.querySelectorAll("button[title]").forEach(b=>{b.getAttribute("title")===apiTitle&&b.remove()});document.querySelectorAll("a").forEach(a=>{const t=a.textContent||"";(t.includes(privacy)||t.includes(terms))&&a.remove()});document.querySelectorAll(".timeline__history-unavailable").forEach(e=>{e.innerHTML="";const i=document.createElement("span");i.className="timeline__history-unavailable-icon";i.setAttribute("aria-hidden","true");i.textContent=String.fromCodePoint(128274);e.append(i," History controls unavailable")})};const p=()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const v=f(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v}document.querySelectorAll("a[href]").forEach(a=>{const v=f(a.getAttribute("href")||"");if(v!==a.getAttribute("href"))a.setAttribute("href",v)});clean()};p();new MutationObserver(p).observe(document.documentElement,{childList:true,subtree:true,characterData:true});setInterval(p,1500)})();</script>`;
}

function rewriteJson(value, key = "") {
  const passthroughKeys = new Set([
    "entry",
    "homepage",
    "npmPackage",
    "packageName",
    "repository",
    "source",
    "url",
  ]);

  if (typeof value === "string") {
    if (passthroughKeys.has(key)) return value;
    return rewriteBrandText(value);
  }

  if (Array.isArray(value)) return value.map(item => rewriteJson(item));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      rewriteJson(entryValue, entryKey),
    ]),
  );
}

function rewriteLocation(location, requestUrl) {
  if (!location) return location;
  const upstream = new URL(UPSTREAM_ORIGIN);
  const current = new URL(requestUrl);
  return location
    .replaceAll(upstream.origin, current.origin)
    .replaceAll(upstream.hostname, current.hostname);
}

export default {
  async fetch(request) {
    const requestUrl = new URL(request.url);
    const authenticated = hasSessionCookie(request.headers.get("Cookie"));
    if (!authenticated && !isPublicPath(requestUrl.pathname)) {
      const acceptsHtml = (request.headers.get("Accept") || "").includes("text/html");
      if (request.method === "GET" && (acceptsHtml || requestUrl.pathname === "/" || requestUrl.pathname === "/register")) {
        return new Response(accessGateHtml(), {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Security-Policy": CSP,
            "Cache-Control": "no-store",
            "X-Linje-Upstream": "access-gate",
          },
        });
      }
      return new Response("Authentication required", {
        status: 401,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const upstreamUrl = new URL(requestUrl.pathname + requestUrl.search, UPSTREAM_ORIGIN);
    const headers = new Headers(request.headers);

    headers.set("X-Forwarded-Host", requestUrl.host);
    headers.set("X-Forwarded-Proto", requestUrl.protocol.replace(":", ""));
    headers.delete("cf-connecting-ip");
    headers.delete("cf-ipcountry");
    headers.delete("cf-ray");
    headers.delete("cf-visitor");

    const method = request.method.toUpperCase();
    const upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers,
      body: method === "GET" || method === "HEAD" ? undefined : request.body,
      redirect: "manual",
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set("Content-Security-Policy", CSP);
    responseHeaders.delete("X-Frame-Options");
    responseHeaders.delete("Content-Length");
    responseHeaders.set("Cache-Control", "no-store");
    responseHeaders.set("X-Linje-Upstream", "linje.dev");

    const location = responseHeaders.get("Location");
    if (location) responseHeaders.set("Location", rewriteLocation(location, request.url));

    const contentType = responseHeaders.get("Content-Type") || "";
    if (
      contentType.includes("text/html") ||
      contentType.includes("javascript") ||
      contentType.includes("text/css")
    ) {
      const body = await upstreamResponse.text();
      const rewritten = contentType.includes("text/html")
        ? rewriteHtml(body)
        : rewriteBrandText(body);

      return new Response(rewritten, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
      });
    }

    if (contentType.includes("application/json")) {
      return new Response(JSON.stringify(rewriteJson(await upstreamResponse.json())), {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
      });
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
