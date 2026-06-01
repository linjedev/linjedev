const UPSTREAM_ORIGIN = "https://demo.worldwideview.dev";
const ASSET_VERSION = "linje-20260601-8";
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
  "/register",
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
const CAPTCHA_SECRET = "linje-track-access-captcha-v1";
const EDGE_OWNER_LOGINS = new Set(["admin", "seb", "sebastian"]);
const EDGE_OWNER_PASSWORD = "sebtest1234";
const EDGE_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getCookie(cookieHeader, name) {
  const match = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(cookieHeader || "");
  return match ? decodeURIComponent(match[1]) : "";
}

async function hasSessionCookie(cookieHeader) {
  if (/(?:^|;\s*)(?:__Secure-)?(?:authjs|next-auth)\.session-token=/.test(cookieHeader || "")) return true;
  return verifyEdgeSession(getCookie(cookieHeader, "linje_access"));
}

function isPublicPath(pathname) {
  return PUBLIC_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix))
    || PUBLIC_FILE_SUFFIXES.some(suffix => pathname.endsWith(suffix));
}

function authStyles() {
  return `<style>:root{color-scheme:dark;--bg:#09090b;--glass:rgba(9,9,11,.75);--glass2:rgba(24,24,27,.85);--border:rgba(255,255,255,.1);--text:#f4f4f5;--muted:#a1a1aa;--amber:#f59e0b}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:linear-gradient(rgba(9,9,11,.76),rgba(9,9,11,.92)),radial-gradient(circle at 50% 110%,rgba(255,255,255,.12),transparent 42%),var(--bg);color:var(--text);font-family:Inter,Arial,sans-serif;padding:16px;overflow:hidden}body:before{content:"";position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:54px 54px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.9),transparent 78%);pointer-events:none}.card{position:relative;z-index:1;width:min(460px,100%);background:var(--glass);border:1px solid var(--border);border-radius:16px;box-shadow:inset 0 1px 1px rgba(255,255,255,.1),0 8px 32px rgba(0,0,0,.4);backdrop-filter:blur(24px);padding:24px;text-align:center}.mark{width:42px;height:42px;margin:0 auto 16px;display:grid;place-items:center;border-radius:10px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.35);font-weight:800}.title{margin:0 0 4px;font-size:22px;letter-spacing:0}.sub{margin:0 0 24px;color:var(--muted);font-size:13px}.form{display:grid;gap:12px;text-align:left}.label{display:grid;gap:6px;color:var(--muted);font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.input{width:100%;min-height:40px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,.04);color:var(--text);font:14px Inter,Arial,sans-serif;outline:0}.input:focus{border-color:rgba(255,255,255,.55);background:var(--glass2);box-shadow:0 0 0 1px rgba(255,255,255,.18)}.button{min-height:40px;padding:11px 14px;border:1px solid rgba(255,255,255,.38);border-radius:10px;background:rgba(255,255,255,.16);color:#fff;font-weight:800;text-decoration:none;text-align:center;cursor:pointer}.button:hover{background:rgba(255,255,255,.24);border-color:rgba(255,255,255,.55)}.ghost{background:var(--glass);border-color:var(--border)}.footer{margin:18px 0 0;color:var(--muted);font-size:13px}.link{color:#fff;font-weight:800;text-decoration:none}.captcha{display:grid;grid-template-columns:1fr 40px;gap:10px;align-items:end}.question{width:max-content;padding:3px 7px;border:1px solid rgba(245,158,11,.28);border-radius:6px;background:rgba(245,158,11,.08);color:var(--amber);font-family:monospace;font-size:12px;letter-spacing:0;text-transform:none}.icon{height:40px;border:1px solid var(--border);border-radius:10px;background:var(--glass);color:#fff;cursor:pointer}.msg{margin:0;color:#22c55e;font-size:13px}.err{margin:0;color:#ef4444;font-size:13px}</style>`;
}

function loginStylePatch() {
  return `<style id="linje-login-style">:root{color-scheme:dark;--bg:#09090b;--glass:rgba(9,9,11,.75);--glass2:rgba(24,24,27,.85);--border:rgba(255,255,255,.1);--text:#f4f4f5;--muted:#a1a1aa}html,body{background:#09090b!important}body{margin:0!important;min-height:100vh!important;display:grid!important;place-items:center!important;background:linear-gradient(rgba(9,9,11,.76),rgba(9,9,11,.92)),radial-gradient(circle at 50% 110%,rgba(255,255,255,.12),transparent 42%),var(--bg)!important;color:var(--text)!important;font-family:Inter,Arial,sans-serif!important;padding:16px!important;overflow:hidden!important}body:before{content:"";position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:54px 54px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.9),transparent 78%);pointer-events:none}[class^="setup_container__"]{min-height:auto!important;width:min(460px,100%)!important;display:block!important;background:transparent!important;padding:0!important;position:relative!important;z-index:1!important}[class^="setup_card__"]{width:100%!important;max-width:460px!important;background:var(--glass)!important;border:1px solid var(--border)!important;border-radius:16px!important;box-shadow:inset 0 1px 1px rgba(255,255,255,.1),0 8px 32px rgba(0,0,0,.4)!important;backdrop-filter:blur(24px)!important;-webkit-backdrop-filter:blur(24px)!important;padding:24px!important;text-align:center!important}[class^="setup_logo__"]{width:42px!important;height:42px!important;margin:0 auto 16px!important;display:grid!important;place-items:center!important;border-radius:10px!important;background:rgba(255,255,255,.16)!important;border:1px solid rgba(255,255,255,.35)!important;color:#fff!important;font-size:20px!important;font-weight:800!important}[class^="setup_title__"]{margin:0 0 4px!important;color:#f4f4f5!important;font-size:22px!important;font-weight:800!important;letter-spacing:0!important;line-height:1.2!important}[class^="setup_subtitle__"]{margin:0 0 24px!important;color:var(--muted)!important;font-size:13px!important}[class^="setup_form__"]{display:grid!important;gap:12px!important;text-align:left!important}[class^="setup_label__"]{display:grid!important;gap:6px!important;color:var(--muted)!important;font-size:11px!important;font-weight:800!important;letter-spacing:.08em!important;text-transform:uppercase!important;margin:0!important}[class^="setup_input__"]{width:100%!important;min-height:50px!important;padding:10px 14px!important;border:1px solid rgba(255,255,255,.1)!important;border-radius:12px!important;background:rgba(255,255,255,.04)!important;color:#f4f4f5!important;font:16px Inter,Arial,sans-serif!important;outline:0!important;box-shadow:none!important}[class^="setup_input__"]:focus{border-color:rgba(255,255,255,.55)!important;background:var(--glass2)!important;box-shadow:0 0 0 1px rgba(255,255,255,.18)!important}[class^="setup_button__"]{min-height:50px!important;margin-top:12px!important;padding:11px 14px!important;border:1px solid rgba(255,255,255,.38)!important;border-radius:12px!important;background:rgba(255,255,255,.16)!important;color:#fff!important;font-size:16px!important;font-weight:800!important;cursor:pointer!important}[class^="setup_button__"]:hover{background:rgba(255,255,255,.24)!important;border-color:rgba(255,255,255,.55)!important}.linje-login-footer{margin:18px 0 0;color:var(--muted);font-size:13px;text-align:center}.linje-login-footer a{color:#fff;font-weight:800;text-decoration:none}</style>`;
}

function restyleLoginHtml(value) {
  return value
    .replace("<head>", `<head>${loginStylePatch()}`)
    .replace(/(<div class="setup_logo__[^\"]*">)W(<\/div>)/, "$1L$2")
    .replace("Enter your credentials to continue", "Approved users can enter the workspace")
    .replace(/(<\/form>)(?![\s\S]*linje-login-footer)/, `$1<p class="linje-login-footer">Need access? <a href="/register">Request approval</a></p>`);
}

function accessGateHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Linje.track Access</title>${authStyles()}</head><body><main class="card"><div class="mark">L</div><h1 class="title">Linje.track</h1><p class="sub">Access is restricted to approved users.</p><div class="form"><a class="button" href="/login">Sign In</a><a class="button ghost" href="/register">Request Access</a></div></main></body></html>`;
}

function toBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(base64);
}

async function hmacSignature(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

async function captchaSignature(payload) {
  return hmacSignature(CAPTCHA_SECRET, payload);
}

async function edgeSessionSignature(payload) {
  return hmacSignature(CAPTCHA_SECRET, payload);
}

async function createCaptcha() {
  const left = Math.floor(Math.random() * 8) + 2;
  const right = Math.floor(Math.random() * 8) + 2;
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({
    answer: left + right,
    expires: Date.now() + 10 * 60 * 1000,
  })));
  return {
    question: `${left} + ${right}`,
    token: `${payload}.${await captchaSignature(payload)}`,
  };
}

async function verifyCaptcha(token, answer) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return false;
  if (await captchaSignature(payload) !== signature) return false;
  try {
    const parsed = JSON.parse(fromBase64Url(payload));
    return Date.now() <= parsed.expires && String(parsed.answer) === String(answer || "").trim();
  } catch {
    return false;
  }
}

async function createEdgeSession(username) {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({
    username,
    role: "admin",
    expires: Date.now() + EDGE_SESSION_TTL_MS,
  })));
  return `${payload}.${await edgeSessionSignature(payload)}`;
}

async function verifyEdgeSession(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return false;
  if (await edgeSessionSignature(payload) !== signature) return false;
  try {
    const parsed = JSON.parse(fromBase64Url(payload));
    return parsed.role === "admin" && Date.now() <= parsed.expires;
  } catch {
    return false;
  }
}

function loginHtml({ error = "" } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign in to Linje.track</title>${authStyles()}</head><body><main class="card"><div class="mark">L</div><h1 class="title">Sign in to Linje.track</h1><p class="sub">Approved users can enter the workspace.</p><form class="form" method="post" action="/login"><label class="label">Username<input class="input" name="email" required autocomplete="username"></label><label class="label">Password<input class="input" name="password" type="password" required autocomplete="current-password"></label>${error ? `<p class="err">${error}</p>` : ""}<button class="button" type="submit">Sign In</button></form><p class="footer">Need access? <a class="link" href="/register">Request approval</a></p></main></body></html>`;
}

async function registerHtml({ error = "", success = "" } = {}) {
  const captcha = await createCaptcha();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Request Linje.track Access</title>${authStyles()}</head><body><main class="card"><div class="mark">L</div><h1 class="title">Request Linje.track access</h1><p class="sub">Approved users can enter the live tracking workspace.</p><form class="form" method="post" action="/register"><label class="label">Display Name<input class="input" name="name" required autocomplete="name"></label><label class="label">Email<input class="input" name="email" type="email" required autocomplete="email"></label><label class="label">Password<input class="input" name="password" type="password" required minlength="8" autocomplete="new-password"></label><label class="label">Confirm Password<input class="input" name="confirm" type="password" required minlength="8" autocomplete="new-password"></label><div class="captcha"><label class="label">Captcha<span class="question">${captcha.question}</span><input class="input" name="captchaAnswer" required inputmode="numeric" pattern="[0-9]*"></label><a class="icon" href="/register" title="Refresh captcha" aria-label="Refresh captcha" style="display:grid;place-items:center;text-decoration:none">↻</a></div><input type="hidden" name="captchaToken" value="${captcha.token}">${error ? `<p class="err">${error}</p>` : ""}${success ? `<p class="msg">${success}</p>` : ""}<button class="button" type="submit">Request Access</button></form><p class="footer">Already approved? <a class="link" href="/login">Sign in</a></p></main></body></html>`;
}

function htmlResponse(body, status = 200, upstream = "access-gate") {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": CSP,
      "Cache-Control": "no-store",
      "X-Linje-Upstream": upstream,
    },
  });
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

function rewriteHtml(value, pathname = "") {
  const branded = pathname === "/login"
    ? restyleLoginHtml(stripRetiredCopy(rewriteBrandText(value)))
    : stripRetiredCopy(rewriteBrandText(value));

  return branded.replace(
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
    if (requestUrl.pathname === "/login") {
      if (request.method.toUpperCase() === "POST") {
        const form = await request.formData();
        const username = String(form.get("email") || "").trim().toLowerCase();
        const password = String(form.get("password") || "");
        if (!EDGE_OWNER_LOGINS.has(username) || password !== EDGE_OWNER_PASSWORD) {
          return htmlResponse(loginHtml({ error: "Invalid username or password." }), 401);
        }

        return new Response(null, {
          status: 302,
          headers: {
            "Location": "/",
            "Set-Cookie": `linje_access=${encodeURIComponent(await createEdgeSession(username))}; Path=/; Max-Age=${Math.floor(EDGE_SESSION_TTL_MS / 1000)}; HttpOnly; Secure; SameSite=Lax`,
            "Cache-Control": "no-store",
          },
        });
      }
      return htmlResponse(loginHtml());
    }

    if (requestUrl.pathname === "/register") {
      if (request.method.toUpperCase() === "POST") {
        const form = await request.formData();
        const password = String(form.get("password") || "");
        const confirm = String(form.get("confirm") || "");
        if (password !== confirm) {
          return htmlResponse(await registerHtml({ error: "Passwords do not match." }));
        }
        if (!await verifyCaptcha(form.get("captchaToken"), form.get("captchaAnswer"))) {
          return htmlResponse(await registerHtml({ error: "Captcha check failed. Refresh it and try again." }));
        }
        return htmlResponse(await registerHtml({ success: "Access request received. An admin will review it." }));
      }
      return htmlResponse(await registerHtml());
    }

    const authenticated = await hasSessionCookie(request.headers.get("Cookie"));
    if (!authenticated && !isPublicPath(requestUrl.pathname)) {
      const acceptsHtml = (request.headers.get("Accept") || "").includes("text/html");
      if (request.method === "GET" && (acceptsHtml || requestUrl.pathname === "/" || requestUrl.pathname === "/register")) {
        return htmlResponse(accessGateHtml());
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
        ? rewriteHtml(body, requestUrl.pathname)
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
