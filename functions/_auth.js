const encoder = new TextEncoder();
const SESSION_COOKIE = "linje_session";
const SESSION_DAYS = 30;
const HASH_ITERATIONS = 120000;

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {})
    }
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function normalizeUsername(username) {
  return String(username || "").trim().replace(/^@+/, "").toLowerCase();
}

export function validateAccount({ username, password }) {
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return "Usernames need 3-24 letters, numbers, or underscores.";
  }

  if (String(password || "").length < 8) {
    return "Passwords need at least 8 characters.";
  }

  return "";
}

export async function hashPassword(password, saltBase64 = "") {
  const salt = saltBase64 ? base64ToBytes(saltBase64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: HASH_ITERATIONS
    },
    key,
    256
  );

  return {
    hash: bytesToBase64(new Uint8Array(hash)),
    salt: bytesToBase64(salt),
    iterations: HASH_ITERATIONS
  };
}

export function timingSafeEqual(a, b) {
  const left = encoder.encode(String(a || ""));
  const right = encoder.encode(String(b || ""));
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] || 0) ^ (right[index] || 0);
  }

  return diff === 0;
}

export async function createSession({ request, env, userId }) {
  const sessionId = randomToken(32);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_DAYS * 24 * 60 * 60;

  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).bind(sessionId, userId, now, expiresAt).run();

  return sessionCookie(request, sessionId, SESSION_DAYS * 24 * 60 * 60);
}

export async function getSessionUser({ request, env }) {
  const sessionId = getCookie(request, SESSION_COOKIE);
  if (!sessionId) return null;

  const now = Math.floor(Date.now() / 1000);
  const user = await env.DB.prepare(
    `SELECT users.id, users.username, users.created_at
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.id = ? AND sessions.expires_at > ?`
  ).bind(sessionId, now).first();

  if (!user) return null;
  return publicUser(user);
}

export async function deleteSession({ request, env }) {
  const sessionId = getCookie(request, SESSION_COOKIE);
  if (sessionId) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
  }
}

export function clearSessionCookie(request) {
  return sessionCookie(request, "", 0);
}

export function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.created_at
  };
}

export function hasDatabase(env) {
  return Boolean(env && env.DB && typeof env.DB.prepare === "function");
}

export async function logAuthEvent({ request, env, userId = "", username = "", event, success, client = {}, failureReason = "" }) {
  if (!hasDatabase(env)) return;

  const metadata = {
    acceptLanguage: request.headers.get("accept-language") || "",
    cfRay: request.headers.get("cf-ray") || "",
    client
  };

  await env.DB.prepare(
    `INSERT INTO auth_events
     (id, user_id, username, event, success, ip_address, user_agent, country, colo, asn, metadata, failure_reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    crypto.randomUUID(),
    userId,
    username,
    event,
    success ? 1 : 0,
    getClientIp(request),
    request.headers.get("user-agent") || "",
    request.headers.get("cf-ipcountry") || "",
    request.cf && request.cf.colo ? String(request.cf.colo) : "",
    request.cf && request.cf.asn ? String(request.cf.asn) : "",
    JSON.stringify(metadata),
    failureReason,
    new Date().toISOString()
  ).run();
}

export function getClientIp(request) {
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")
    || "";
}

function getCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  return header.split(";").map((item) => item.trim()).reduce((found, item) => {
    if (found) return found;
    const [key, ...rest] = item.split("=");
    return key === name ? decodeURIComponent(rest.join("=")) : "";
  }, "");
}

function sessionCookie(request, value, maxAge) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function randomToken(bytes) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return [...data].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
