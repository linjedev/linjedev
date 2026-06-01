const UPSTREAM_ORIGIN = "https://demo.worldwideview.dev";
const ASSET_VERSION = "linje-20260601-11";
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
const BACKGROUND_CSP = CSP.replace("frame-ancestors 'none'", "frame-ancestors 'self'");

const PUBLIC_PATH_PREFIXES = [
  "/auth-background",
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
const ACCESS_STORE_KEY = "linje-track-access-requests-v1";
const CACHE_STORE_URL = "https://linje.dev/__edge-access-store";
const memoryStore = { requests: [], users: [] };

function getCookie(cookieHeader, name) {
  const match = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(cookieHeader || "");
  return match ? decodeURIComponent(match[1]) : "";
}

async function hasSessionCookie(cookieHeader) {
  if (/(?:^|;\s*)(?:__Secure-)?(?:authjs|next-auth)\.session-token=/.test(cookieHeader || "")) return true;
  return verifyEdgeSession(getCookie(cookieHeader, "linje_access"));
}

async function hasAdminSessionCookie(cookieHeader) {
  const token = getCookie(cookieHeader, "linje_access");
  if (EDGE_OWNER_LOGINS.has(normalizeLogin(token))) return true;
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

function isPublicPath(pathname) {
  return PUBLIC_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix))
    || PUBLIC_FILE_SUFFIXES.some(suffix => pathname.endsWith(suffix));
}

function authStyles() {
  return `<style>:root{color-scheme:dark;--bg:#050506;--glass:rgba(8,8,10,.42);--glass2:rgba(24,24,27,.72);--border:rgba(255,255,255,.14);--text:#f4f4f5;--muted:#a1a1aa;--amber:#f59e0b}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#050506;color:var(--text);font-family:Inter,Arial,sans-serif;padding:16px;overflow:hidden}.auth-globe-frame{position:fixed;inset:0;width:100%;height:100%;border:0;z-index:0;opacity:.82;filter:brightness(.48) saturate(.95) blur(1.2px);transform:scale(1.025);transform-origin:center;pointer-events:none;background:#050506}body:before{content:"";position:fixed;inset:0;z-index:1;background-image:linear-gradient(rgba(255,255,255,.026) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.026) 1px,transparent 1px);background-size:54px 54px;background-position:center;mask-image:linear-gradient(to bottom,rgba(0,0,0,.9),transparent 88%);pointer-events:none}body:after{content:"";position:fixed;inset:0;z-index:1;background:radial-gradient(circle at 50% 48%,transparent 0,rgba(0,0,0,.22) 35%,rgba(0,0,0,.78) 100%),linear-gradient(to top,rgba(0,0,0,.82),transparent 58%);pointer-events:none}.card{position:relative;z-index:2;width:min(460px,100%);background:linear-gradient(145deg,rgba(12,12,14,.42),rgba(6,6,8,.24));border:1px solid var(--border);border-radius:16px;box-shadow:inset 0 1px 1px rgba(255,255,255,.2),inset 0 -1px 16px rgba(255,255,255,.05),0 24px 80px rgba(0,0,0,.58);backdrop-filter:blur(34px) saturate(1.35);-webkit-backdrop-filter:blur(34px) saturate(1.35);padding:24px;text-align:center}.mark{width:42px;height:42px;margin:0 auto 16px;display:grid;place-items:center;border-radius:10px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.35);font-weight:800}.title{margin:0 0 4px;font-size:22px;letter-spacing:0}.sub{margin:0 0 24px;color:var(--muted);font-size:13px}.form{display:grid;gap:12px;text-align:left}.label{display:grid;gap:6px;color:var(--muted);font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.input{width:100%;min-height:40px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,.045);color:var(--text);font:14px Inter,Arial,sans-serif;outline:0}.input:focus{border-color:rgba(255,255,255,.55);background:var(--glass2);box-shadow:0 0 0 1px rgba(255,255,255,.18)}.button{min-height:40px;padding:11px 14px;border:1px solid rgba(255,255,255,.38);border-radius:10px;background:rgba(255,255,255,.16);color:#fff;font-weight:800;text-decoration:none;text-align:center;cursor:pointer}.button:hover{background:rgba(255,255,255,.24);border-color:rgba(255,255,255,.55)}.ghost{background:rgba(255,255,255,.06);border-color:var(--border)}.footer{margin:18px 0 0;color:var(--muted);font-size:13px}.link{color:#fff;font-weight:800;text-decoration:none}.captcha{display:grid;grid-template-columns:1fr 40px;gap:10px;align-items:end}.question{width:max-content;padding:3px 7px;border:1px solid rgba(245,158,11,.28);border-radius:6px;background:rgba(245,158,11,.08);color:var(--amber);font-family:monospace;font-size:12px;letter-spacing:0;text-transform:none}.icon{height:40px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,.06);color:#fff;cursor:pointer}.msg{margin:0;color:#22c55e;font-size:13px}.err{margin:0;color:#ef4444;font-size:13px}</style>`;
}

function authGlobeFrame() {
  return `<iframe class="auth-globe-frame" src="/auth-background" aria-hidden="true" tabindex="-1"></iframe>`;
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
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Linje.track Access</title>${authStyles()}</head><body>${authGlobeFrame()}<main class="card"><div class="mark">L</div><h1 class="title">Linje.track</h1><p class="sub">Access is restricted to approved users.</p><div class="form"><a class="button" href="/login">Sign In</a><a class="button ghost" href="/register">Request Access</a></div></main></body></html>`;
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

async function createEdgeSession(username, role = "user") {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({
    username,
    role,
    expires: Date.now() + EDGE_SESSION_TTL_MS,
  })));
  return `${payload}.${await edgeSessionSignature(payload)}`;
}

async function verifyEdgeSession(token) {
  if (EDGE_OWNER_LOGINS.has(String(token || "").trim().toLowerCase())) return true;
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return false;
  if (await edgeSessionSignature(payload) !== signature) return false;
  try {
    const parsed = JSON.parse(fromBase64Url(payload));
    return (parsed.role === "admin" || parsed.role === "user") && Date.now() <= parsed.expires;
  } catch {
    return false;
  }
}

function emptyAccessStore() {
  return { requests: [], users: [] };
}

function normalizeLogin(value) {
  return String(value || "").trim().toLowerCase();
}

function loginMatchesUser(user, normalizedLogin) {
  return [
    user.login,
    user.email,
    user.name,
    String(user.name || "").replace(/\s+/g, ""),
  ].some(value => normalizeLogin(value) === normalizedLogin);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function requestId() {
  return `${Date.now().toString(36)}-${crypto.randomUUID()}`;
}

function accessStoreBinding(env) {
  const named = env?.LINJE_ACCESS || env?.ACCESS_REQUESTS || env?.ACCESS_STORE || env?.KV;
  if (named?.get && named?.put) return named;
  return Object.values(env || {}).find(value => value?.get && value?.put) || null;
}

async function readAccessStore(env) {
  const binding = accessStoreBinding(env);
  if (binding?.get) {
    try {
      return JSON.parse(await binding.get(ACCESS_STORE_KEY) || JSON.stringify(emptyAccessStore()));
    } catch {}
  }

  if (typeof caches !== "undefined") {
    try {
      const response = await caches.default.match(new Request(CACHE_STORE_URL));
      if (response) return JSON.parse(await response.text());
    } catch {}
  }

  return {
    requests: Array.isArray(memoryStore.requests) ? memoryStore.requests : [],
    users: Array.isArray(memoryStore.users) ? memoryStore.users : [],
  };
}

async function writeAccessStore(env, store) {
  const normalized = {
    requests: Array.isArray(store.requests) ? store.requests : [],
    users: Array.isArray(store.users) ? store.users : [],
  };
  memoryStore.requests = normalized.requests;
  memoryStore.users = normalized.users;

  const value = JSON.stringify(normalized);
  const binding = accessStoreBinding(env);
  if (binding?.put) {
    try {
      await binding.put(ACCESS_STORE_KEY, value);
      return true;
    } catch {}
  }

  if (typeof caches !== "undefined") {
    try {
      await caches.default.put(
        new Request(CACHE_STORE_URL),
        new Response(value, {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=31536000",
          },
        }),
      );
      return true;
    } catch {}
  }
  return false;
}

async function approvedAccessUser(env, login, password) {
  const normalized = normalizeLogin(login);
  if (EDGE_OWNER_LOGINS.has(normalized) && password === EDGE_OWNER_PASSWORD) {
    return { login: normalized, name: normalized, role: "admin" };
  }
  const store = await readAccessStore(env);
  return store.users.find(user =>
    user.status === "approved" &&
    loginMatchesUser(user, normalized) &&
    user.password === password
  ) || null;
}

async function saveAccessRequest(env, form) {
  const name = String(form.get("name") || "").trim();
  const email = normalizeLogin(form.get("email"));
  const password = String(form.get("password") || "");
  const store = await readAccessStore(env);
  const existingUser = store.users.find(user => normalizeLogin(user.login) === email);
  if (existingUser?.status === "approved") return { ok: false, message: "That login is already approved. Sign in instead." };

  const existingRequest = store.requests.find(req => normalizeLogin(req.email) === email && req.status === "pending");
  if (existingRequest) {
    existingRequest.name = name;
    existingRequest.password = password;
    existingRequest.updatedAt = new Date().toISOString();
  } else {
    store.requests.unshift({
      id: requestId(),
      name,
      email,
      password,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  await writeAccessStore(env, store);
  const check = await readAccessStore(env);
  const saved = check.requests.some(req => normalizeLogin(req.email) === email && req.status === "pending");
  if (!saved) {
    return {
      ok: false,
      message: "Access storage is not connected yet. Add a Cloudflare KV binding named LINJE_ACCESS, then try again.",
    };
  }
  return { ok: true, message: "Access request received. An admin will review it." };
}

async function updateAccessRequest(env, id, action) {
  const store = await readAccessStore(env);
  if (action === "revoke") {
    const user = store.users.find(item => item.id === id || normalizeLogin(item.login) === normalizeLogin(id));
    if (!user) return { ok: false, message: "Approved user not found." };
    store.users = store.users.filter(item => item.id !== user.id);
    const request = store.requests.find(item => item.id === user.id || normalizeLogin(item.email) === normalizeLogin(user.login));
    if (request) {
      request.status = "denied";
      request.updatedAt = new Date().toISOString();
    }
    const written = await writeAccessStore(env, store);
    if (!written) return { ok: false, message: "Access storage is not connected." };
    return { ok: true, message: "User access revoked." };
  }

  const request = store.requests.find(item => item.id === id);
  if (!request) return { ok: false, message: "Request not found." };
  request.status = action === "approve" ? "approved" : "denied";
  request.updatedAt = new Date().toISOString();

  const login = normalizeLogin(request.email);
  store.users = store.users.filter(user => normalizeLogin(user.login) !== login);
  if (request.status === "approved") {
    store.users.unshift({
      id: request.id,
      login,
      name: request.name,
      password: request.password,
      status: "approved",
      approvedAt: new Date().toISOString(),
    });
  }

  const written = await writeAccessStore(env, store);
  if (!written) return { ok: false, message: "Access storage is not connected." };
  return { ok: true, message: request.status === "approved" ? "User approved." : "Request denied." };
}

function loginHtml({ error = "" } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign in to Linje.track</title>${authStyles()}</head><body>${authGlobeFrame()}<main class="card"><div class="mark">L</div><h1 class="title">Sign in to Linje.track</h1><p class="sub">Approved users can enter the workspace.</p><form class="form" method="post" action="/login"><label class="label">Username<input class="input" name="username" required autocomplete="username" autocapitalize="none" spellcheck="false"></label><label class="label">Password<input class="input" name="password" type="password" required autocomplete="current-password"></label>${error ? `<p class="err">${error}</p>` : ""}<button class="button" type="submit">Sign In</button></form><p class="footer">Need access? <a class="link" href="/register">Request approval</a></p></main></body></html>`;
}

async function loginRedirectResponse(username, requestUrl, role = "user") {
  const target = new URL("/", requestUrl);
  const sessionValue = EDGE_OWNER_LOGINS.has(normalizeLogin(username))
    ? normalizeLogin(username)
    : await createEdgeSession(username, role);
  return new Response(null, {
    status: 303,
    headers: {
      "Location": target.toString(),
      "Set-Cookie": `linje_access=${encodeURIComponent(sessionValue)}; Path=/; Max-Age=${Math.floor(EDGE_SESSION_TTL_MS / 1000)}; HttpOnly; Secure; SameSite=Lax`,
      "Cache-Control": "no-store",
    },
  });
}

async function registerHtml({ error = "", success = "" } = {}) {
  const captcha = await createCaptcha();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Request Linje.track Access</title>${authStyles()}</head><body>${authGlobeFrame()}<main class="card"><div class="mark">L</div><h1 class="title">Request Linje.track access</h1><p class="sub">Approved users can enter the live tracking workspace.</p><form class="form" method="post" action="/register"><label class="label">Display Name<input class="input" name="name" required autocomplete="name"></label><label class="label">Email<input class="input" name="email" type="email" required autocomplete="email"></label><label class="label">Password<input class="input" name="password" type="password" required minlength="8" autocomplete="new-password"></label><label class="label">Confirm Password<input class="input" name="confirm" type="password" required minlength="8" autocomplete="new-password"></label><div class="captcha"><label class="label">Captcha<span class="question">${captcha.question}</span><input class="input" name="captchaAnswer" required inputmode="numeric" pattern="[0-9]*"></label><a class="icon" href="/register" title="Refresh captcha" aria-label="Refresh captcha" style="display:grid;place-items:center;text-decoration:none">↻</a></div><input type="hidden" name="captchaToken" value="${captcha.token}">${error ? `<p class="err">${error}</p>` : ""}${success ? `<p class="msg">${success}</p>` : ""}<button class="button" type="submit">Request Access</button></form><p class="footer">Already approved? <a class="link" href="/login">Sign in</a></p></main></body></html>`;
}

function adminStyles() {
  return `<style>:root{color-scheme:dark;--bg:#050506;--glass:rgba(8,8,10,.44);--border:rgba(255,255,255,.14);--text:#f4f4f5;--muted:#a1a1aa;--ok:#22c55e;--bad:#ef4444;--warn:#f59e0b}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#050506;color:var(--text);font-family:Inter,Arial,sans-serif;overflow-x:hidden}.auth-globe-frame{position:fixed;inset:0;width:100%;height:100%;border:0;z-index:0;opacity:.72;filter:brightness(.38) saturate(.9) blur(1.2px);transform:scale(1.025);pointer-events:none}body:before{content:"";position:fixed;inset:0;z-index:1;background:radial-gradient(circle at 50% 30%,rgba(255,255,255,.06),transparent 28%),linear-gradient(to bottom,rgba(0,0,0,.34),rgba(0,0,0,.9));pointer-events:none}.wrap{position:relative;z-index:2;width:min(1080px,calc(100% - 32px));margin:40px auto}.panel{background:linear-gradient(145deg,rgba(12,12,14,.52),rgba(6,6,8,.3));border:1px solid var(--border);border-radius:16px;box-shadow:inset 0 1px 1px rgba(255,255,255,.18),0 24px 80px rgba(0,0,0,.56);backdrop-filter:blur(34px) saturate(1.35);-webkit-backdrop-filter:blur(34px) saturate(1.35);padding:24px}.top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:22px}.mark{width:42px;height:42px;display:grid;place-items:center;border-radius:10px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.35);font-weight:800}.title-row{display:flex;gap:14px;align-items:center}.title{margin:0;font-size:24px;letter-spacing:0}.sub{margin:4px 0 0;color:var(--muted);font-size:13px}.link{color:#fff;text-decoration:none;font-weight:800}.pill{display:inline-flex;align-items:center;min-height:24px;padding:3px 8px;border:1px solid var(--border);border-radius:999px;background:rgba(255,255,255,.06);color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em}.grid{display:grid;gap:14px}.section{border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.035);overflow:hidden}.section-head{display:flex;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.09)}.section-title{margin:0;font-size:13px;text-transform:uppercase;letter-spacing:.08em}.rows{display:grid}.row{display:grid;grid-template-columns:1.3fr 1.4fr .8fr auto;gap:12px;align-items:center;padding:14px 16px;border-top:1px solid rgba(255,255,255,.07)}.row:first-child{border-top:0}.name{font-weight:800}.meta,.date{color:var(--muted);font-size:12px}.status{width:max-content;padding:3px 7px;border-radius:999px;border:1px solid var(--border);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.07em}.status.pending{color:var(--warn);border-color:rgba(245,158,11,.28);background:rgba(245,158,11,.08)}.status.approved{color:var(--ok);border-color:rgba(34,197,94,.25);background:rgba(34,197,94,.08)}.status.denied{color:var(--bad);border-color:rgba(239,68,68,.25);background:rgba(239,68,68,.08)}.actions,.actions form{display:flex;gap:8px;justify-content:flex-end}.button{min-height:34px;padding:8px 11px;border:1px solid rgba(255,255,255,.3);border-radius:10px;background:rgba(255,255,255,.12);color:#fff;font-weight:800;cursor:pointer}.button:hover{background:rgba(255,255,255,.2)}.button.deny{border-color:rgba(239,68,68,.35);color:#fecaca}.empty{padding:24px 16px;color:var(--muted);font-size:13px}.msg{margin:0 0 14px;color:var(--ok);font-size:13px}.err{margin:0 0 14px;color:var(--bad);font-size:13px}@media(max-width:760px){.top,.title-row{display:grid}.row{grid-template-columns:1fr}.actions,.actions form{justify-content:flex-start}}</style>`;
}

function requestRows(requests) {
  if (!requests.length) return `<div class="empty">No access requests yet.</div>`;
  return `<div class="rows">${requests.map(req => `<div class="row"><div><div class="name">${escapeHtml(req.name || "Unnamed")}</div><div class="meta">${escapeHtml(req.email)}</div></div><div class="date">${escapeHtml(req.createdAt || "")}</div><span class="status ${escapeHtml(req.status)}">${escapeHtml(req.status)}</span><div class="actions">${req.status === "pending" ? `<form method="post" action="/admin"><input type="hidden" name="id" value="${escapeHtml(req.id)}"><button class="button" name="action" value="approve" type="submit">Approve</button><button class="button deny" name="action" value="deny" type="submit">Deny</button></form>` : ""}</div></div>`).join("")}</div>`;
}

function userRows(users) {
  const approved = users.filter(user => user.status === "approved");
  if (!approved.length) return `<div class="empty">No approved users yet.</div>`;
  return `<div class="rows">${approved.map(user => `<div class="row"><div><div class="name">${escapeHtml(user.name || user.login)}</div><div class="meta">${escapeHtml(user.login)}</div></div><div class="date">${escapeHtml(user.approvedAt || "")}</div><span class="status approved">approved</span><div class="actions"><form method="post" action="/admin"><input type="hidden" name="id" value="${escapeHtml(user.id || user.login)}"><button class="button deny" name="action" value="revoke" type="submit">Revoke</button></form></div></div>`).join("")}</div>`;
}

async function adminHtml(env, { message = "", error = "" } = {}) {
  const store = await readAccessStore(env);
  const pending = store.requests.filter(req => req.status === "pending").length;
  const storageWarning = accessStoreBinding(env) ? "" : `<p class="err">Cloudflare KV is not bound. Add a KV binding named LINJE_ACCESS to make requests persist across users.</p>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Linje.track Administrator</title>${adminStyles()}</head><body>${authGlobeFrame()}<main class="wrap"><section class="panel"><div class="top"><div class="title-row"><div class="mark">L</div><div><h1 class="title">Administrator</h1><p class="sub">Approve or deny Linje.track access requests.</p></div></div><a class="link" href="/">Back to globe</a></div>${storageWarning}${message ? `<p class="msg">${escapeHtml(message)}</p>` : ""}${error ? `<p class="err">${escapeHtml(error)}</p>` : ""}<div class="grid"><section class="section"><div class="section-head"><h2 class="section-title">Access Requests</h2><span class="pill">${pending} pending</span></div>${requestRows(store.requests)}</section><section class="section"><div class="section-head"><h2 class="section-title">Approved Users</h2><span class="pill">${store.users.filter(user => user.status === "approved").length} active</span></div>${userRows(store.users)}</section></div></section></main></body></html>`;
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
  [/\bWWV\b/g, "LIN"],
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
  ).replace("</body>", `${pathname === "/auth-background" ? authBackgroundPatch() : ""}${brandPatchScript()}</body>`);
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
  return `<script>(()=>{const h=["worldwideview","dev"].join(".");const oldHistory=["History unavailable on","demo"].join(" ");const oldTitle=["Linje.track","demo"].join(" ");const oldLower=["linje.track","demo"].join(" ");const privacy=["Privacy","Policy"].join(" ");const terms=["Terms","of","Service"].join(" ");const apiTitle=["API","Keys"].join(" ");const r=[[[ "WORLD","WIDE","VIEW"].join(" "),"LINJE.TRACK"],[[ "World","Wide","View"].join(" "),"Linje.track"],[[ "World","WideView"].join(""),"Linje.track"],[[ "Worldwide","View"].join(""),"Linje.track"],["WWV","LIN"],[[ "https://",h,"/"].join(""),"https://linje.dev/"],[[ "https://",h].join(""),"https://linje.dev"],[oldHistory,"History controls unavailable"],[oldTitle,"Linje.track"],[oldLower,"linje.track"]];const f=s=>r.reduce((v,[a,b])=>v.split(a).join(b),s);let clickCount=0,lastClick=0;const bindAdminLogo=()=>{const logo=[...document.querySelectorAll(".header__brand a,.header__logo")].find(el=>/LIN/i.test(el.textContent||""));const target=logo?.closest("a")||logo;if(!target||target.dataset.linjeAdminTripleClick==="true")return;target.dataset.linjeAdminTripleClick="true";target.style.cursor="pointer";target.addEventListener("click",ev=>{if(ev.target&&ev.target.closest&&ev.target.closest(".search-bar,input,button"))return;const now=Date.now();clickCount=now-lastClick>1200?1:clickCount+1;lastClick=now;if(clickCount<3){ev.preventDefault();ev.stopPropagation();return}ev.preventDefault();ev.stopPropagation();clickCount=0;lastClick=0;window.location.href="/admin"},true)};const clean=()=>{document.querySelectorAll(".header__logo--compact").forEach(e=>{if((e.textContent||"").trim()==="WWV"||(e.textContent||"").trim()==="LINJE")e.textContent="LIN"});document.querySelectorAll(".administrator-link").forEach(e=>e.remove());document.querySelectorAll("#linje-admin-link-style").forEach(e=>e.remove());document.querySelectorAll(".legal-footer").forEach(e=>e.remove());document.querySelectorAll("button[title]").forEach(b=>{b.getAttribute("title")===apiTitle&&b.remove()});document.querySelectorAll("a").forEach(a=>{const t=a.textContent||"";(t.includes(privacy)||t.includes(terms))&&a.remove()});document.querySelectorAll(".timeline__history-unavailable").forEach(e=>{e.innerHTML="";const i=document.createElement("span");i.className="timeline__history-unavailable-icon";i.setAttribute("aria-hidden","true");i.textContent=String.fromCodePoint(128274);e.append(i," History controls unavailable")});bindAdminLogo()};const p=()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const v=f(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v}document.querySelectorAll("a[href]").forEach(a=>{const v=f(a.getAttribute("href")||"");if(v!==a.getAttribute("href"))a.setAttribute("href",v)});clean()};p();new MutationObserver(p).observe(document.documentElement,{childList:true,subtree:true,characterData:true});setInterval(p,1500)})();</script>`;
}

function authBackgroundPatch() {
  return `<style id="linje-auth-background-style">html,body,#__next{width:100%!important;height:100%!important;margin:0!important;overflow:hidden!important;background:#050506!important}.legal-footer,.top-bar,.sidebar,.side-panel,.hud-panel,.hud-controls,.bottom-panel-system,.panel-toggle-btn,.camera-stats,.entity-info-card,.floating-video-manager,[class*="Toolbar"],[class*="Panel"],[class*="Modal"]{display:none!important}.app-shell,.app-shell__globe,.cesium-viewer,.cesium-widget,.cesium-widget canvas{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important}.cesium-viewer-bottom,.cesium-viewer-toolbar{display:none!important}</style><script>try{document.documentElement.dataset.authBackground="true";localStorage.setItem("wwv_map_layer","google-3d")}catch(e){}</script>`;
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

function upstreamRequestHeaders(request, requestUrl) {
  const headers = new Headers(request.headers);
  headers.set("X-Forwarded-Host", requestUrl.host);
  headers.set("X-Forwarded-Proto", requestUrl.protocol.replace(":", ""));
  headers.delete("cf-connecting-ip");
  headers.delete("cf-ipcountry");
  headers.delete("cf-ray");
  headers.delete("cf-visitor");
  return headers;
}

async function authBackgroundResponse(request) {
  const requestUrl = new URL(request.url);
  const upstreamResponse = await fetch(new URL("/", UPSTREAM_ORIGIN), {
    method: "GET",
    headers: upstreamRequestHeaders(request, requestUrl),
    redirect: "manual",
  });
  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.set("Content-Security-Policy", BACKGROUND_CSP);
  responseHeaders.delete("X-Frame-Options");
  responseHeaders.delete("Content-Length");
  responseHeaders.set("Cache-Control", "no-store");
  responseHeaders.set("X-Linje-Upstream", "auth-background");
  const body = await upstreamResponse.text();
  return new Response(rewriteHtml(body, "/auth-background"), {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    if (requestUrl.pathname === "/auth-background") {
      return authBackgroundResponse(request);
    }

    if (requestUrl.pathname === "/admin") {
      if (!await hasAdminSessionCookie(request.headers.get("Cookie"))) {
        if (request.method.toUpperCase() === "GET") return htmlResponse(loginHtml({ error: "Sign in as admin first." }), 401);
        return new Response("Admin authentication required", { status: 401 });
      }
      if (request.method.toUpperCase() === "POST") {
        const form = await request.formData();
        const result = await updateAccessRequest(env, String(form.get("id") || ""), String(form.get("action") || ""));
        return htmlResponse(await adminHtml(env, result.ok ? { message: result.message } : { error: result.message }));
      }
      return htmlResponse(await adminHtml(env), 200, "admin");
    }

    if (requestUrl.pathname === "/login") {
      if (request.method.toUpperCase() === "POST") {
        const form = await request.formData();
        const username = String(form.get("username") || form.get("email") || "").trim().toLowerCase();
        const password = String(form.get("password") || "");
        const approvedUser = await approvedAccessUser(env, username, password);
        if (!approvedUser) {
          return htmlResponse(loginHtml({ error: "Invalid username or password." }), 401);
        }

        const role = EDGE_OWNER_LOGINS.has(username) ? "admin" : "user";
        return loginRedirectResponse(approvedUser.login || username, request.url, role);
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
        const result = await saveAccessRequest(env, form);
        return htmlResponse(await registerHtml(result.ok ? { success: result.message } : { error: result.message }));
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
    const headers = upstreamRequestHeaders(request, requestUrl);

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
