const encoder = new TextEncoder();
const SESSION_COOKIE = "linje_session";
const SESSION_DAYS = 30;
const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const BLOCKED_USERNAME_TERMS = [
  "6b6b6b",
  "6e617a69",
  "6869746c6572",
  "7768697465706f776572",
  "776869746573757072656d616379",
  "6e6967676572",
  "6e69676761",
  "6b696b65",
  "6368696e6b",
  "73706963",
  "70616b69",
  "7765746261636b",
  "636f6f6e",
  "676f6f6b",
  "72616768656164",
  "746f77656c68656164"
].map(hexToText);

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
  if (!/^[a-z0-9_]{1,24}$/.test(username)) {
    return "Usernames need 1-24 letters, numbers, or underscores.";
  }

  if (isBlockedUsername(username)) {
    return "Choose a different username.";
  }

  if (String(password || "").length < 8) {
    return "Passwords need at least 8 characters.";
  }

  return "";
}

export async function createCaptchaChallenge(env) {
  const left = randomInt(4, 19);
  const right = randomInt(2, 13);
  const answer = String(left + right);
  const question = `${left} + ${right}`;
  const expiresAt = Date.now() + CAPTCHA_TTL_MS;
  const payload = {
    answer,
    expiresAt,
    question,
    nonce: randomToken(12)
  };
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = await signCaptcha(body, env);

  return {
    question,
    token: `${body}.${signature}`,
    expiresAt
  };
}

export async function verifyCaptcha({ token, answer, env }) {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) return false;

  const expected = await signCaptcha(body, env);
  if (!timingSafeEqual(signature, expected)) return false;

  try {
    const payload = JSON.parse(base64UrlDecode(body));
    if (!payload || Number(payload.expiresAt) < Date.now()) return false;
    return normalizeCaptchaAnswer(answer) === normalizeCaptchaAnswer(payload.answer)
      || normalizeCaptchaAnswer(answer) === normalizeCaptchaAnswer(payload.question);
  } catch {
    return false;
  }
}

function normalizeCaptchaAnswer(value) {
  return String(value || "").trim().replace(/\s+/g, "");
}

export function isBlockedUsername(username) {
  const compact = normalizeForModeration(username);
  return BLOCKED_USERNAME_TERMS.some((term) => compact.includes(term));
}

function normalizeForModeration(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[@]/g, "a")
    .replace(/[4]/g, "a")
    .replace(/[3]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[^a-z0-9]/g, "");
}

export async function hashPassword(password, saltBase64 = "") {
  const salt = saltBase64 ? base64ToBytes(saltBase64) : crypto.getRandomValues(new Uint8Array(16));
  const material = new Uint8Array(salt.length + encoder.encode(password).length);
  material.set(salt, 0);
  material.set(encoder.encode(password), salt.length);
  const hash = await crypto.subtle.digest("SHA-256", material);

  return {
    hash: bytesToBase64(new Uint8Array(hash)),
    salt: bytesToBase64(salt),
    iterations: 1
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
    city: request.cf && request.cf.city ? String(request.cf.city) : "",
    continent: request.cf && request.cf.continent ? String(request.cf.continent) : "",
    latitude: request.cf && request.cf.latitude ? String(request.cf.latitude) : "",
    longitude: request.cf && request.cf.longitude ? String(request.cf.longitude) : "",
    postalCode: request.cf && request.cf.postalCode ? String(request.cf.postalCode) : "",
    region: request.cf && request.cf.region ? String(request.cf.region) : "",
    regionCode: request.cf && request.cf.regionCode ? String(request.cf.regionCode) : "",
    timezone: request.cf && request.cf.timezone ? String(request.cf.timezone) : "",
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
    request.headers.get("cf-ipcountry") || (request.cf && request.cf.country ? String(request.cf.country) : ""),
    request.cf && request.cf.colo ? String(request.cf.colo) : "",
    request.cf && request.cf.asn ? String(request.cf.asn) : "",
    JSON.stringify(metadata),
    failureReason,
    new Date().toISOString()
  ).run();
}

export function getClientIp(request) {
  return request.headers.get("cf-connecting-ip")
    || firstForwardedIp(request.headers.get("x-forwarded-for"))
    || request.headers.get("x-real-ip")
    || "";
}

function firstForwardedIp(value) {
  return String(value || "").split(",")[0].trim();
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

function randomInt(min, max) {
  const range = max - min + 1;
  const data = crypto.getRandomValues(new Uint8Array(1));
  return min + (data[0] % range);
}

async function signCaptcha(body, env) {
  const secret = encoder.encode((env && env.CAPTCHA_SECRET) || "linje-dev-captcha-v1");
  const key = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

function base64UrlEncode(value) {
  return base64UrlEncodeBytes(encoder.encode(value));
}

function base64UrlEncodeBytes(bytes) {
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const base64 = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
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

function hexToText(hex) {
  let text = "";
  for (let index = 0; index < hex.length; index += 2) {
    text += String.fromCharCode(Number.parseInt(hex.slice(index, index + 2), 16));
  }
  return text;
}
