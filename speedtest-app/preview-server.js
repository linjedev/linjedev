const http = require("http");
const childProcess = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const root = __dirname;
const users = new Map();
const sessions = new Map();
const profiles = new Map();
const arcadeScores = new Map();
const secureMessageRequests = new Map();
const secureMessageAccess = new Map();
const secureMessageEvents = [];
const worldNewsRequests = new Map();
const worldNewsAccess = new Map();
const authEvents = [];
const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || crypto.randomBytes(32).toString("hex");
const PREVIEW_HOST = process.env.PREVIEW_HOST || "127.0.0.1";
const PREVIEW_PORT = Number(process.env.PREVIEW_PORT || 4173);
const PASSWORD_ITERATIONS = 100000;
const blockedUsernameTerms = [
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
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    await handleApi(request, response, url.pathname);
    return;
  }

  const name = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const file = path.join(root, name);

  fs.readFile(file, (error, data) => {
    if (error) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("not found");
      return;
    }

    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": types[path.extname(file)] || "application/octet-stream"
    });
    response.end(data);
  });
}).listen(PREVIEW_PORT, PREVIEW_HOST, () => {
  console.log(`Linje Speed preview: http://${PREVIEW_HOST}:${PREVIEW_PORT}/`);
});

async function handleApi(request, response, pathname) {
  if (pathname === "/api/session" && request.method === "GET") {
    const user = currentUser(request);
    sendJson(response, 200, { authenticated: Boolean(user), user });
    return;
  }

  if (pathname === "/api/visitor" && request.method === "GET") {
    sendJson(response, 200, {
      ipAddress: normalizePreviewIp(request.socket.remoteAddress || ""),
      userAgent: request.headers["user-agent"] || "unavailable"
    });
    return;
  }

  if (pathname === "/api/captcha" && request.method === "GET") {
    sendJson(response, 200, createCaptchaChallenge());
    return;
  }

  if (pathname === "/api/github/commits" && request.method === "GET") {
    const activity = await getCommitActivity();
    sendJson(response, 200, {
      query: activity.query || "author:linjedev",
      fallback: activity.fallback,
      status: activity.status,
      totalCommits: activity.totalCommits,
      hourBuckets: activity.hourBuckets,
      cachedFor: 60
    }, {
      "cache-control": "public, max-age=60"
    });
    return;
  }

  if (pathname === "/api/arcade/leaderboard" && request.method === "GET") {
    sendJson(response, 200, { scores: getPreviewArcadeScores() });
    return;
  }

  if (pathname === "/api/world-news/access" && request.method === "GET") {
    const user = currentUser(request);
    if (!user) {
      sendJson(response, 401, { error: "Login required." });
      return;
    }
    sendJson(response, 200, worldNewsEnrollment(user));
    return;
  }

  if (pathname === "/api/world-news/access" && request.method === "POST") {
    const user = currentUser(request);
    if (!user) {
      sendJson(response, 401, { error: "Login required." });
      return;
    }
    const now = new Date().toISOString();
    worldNewsRequests.set(user.id, {
      requestedAt: now,
      status: isPreviewAdmin(user) ? "approved" : "pending",
      username: user.username
    });
    if (isPreviewAdmin(user)) {
      worldNewsAccess.set(user.id, {
        active: true,
        grantedAt: now,
        grantedBy: user.username,
        username: user.username
      });
    }
    sendJson(response, 200, worldNewsEnrollment(user));
    return;
  }

  if (pathname === "/api/world-news/config" && request.method === "GET") {
    sendJson(response, 200, {
      cesiumBaseUrl: "/cesium/",
      cesiumIonToken: process.env.CESIUM_ION_TOKEN || ""
    }, {
      "cache-control": "no-store"
    });
    return;
  }

  if (pathname === "/api/world-news/feed" && request.method === "GET") {
    const user = currentUser(request);
    if (!user) {
      sendJson(response, 401, { error: "Login required." });
      return;
    }
    if (!worldNewsEnrollment(user).allowed) {
      sendJson(response, 403, { error: "World Watch approval required." });
      return;
    }
    sendJson(response, 200, await getPreviewWorldNews());
    return;
  }

  if (pathname === "/api/secure-message/access" && request.method === "GET") {
    const user = currentUser(request);
    if (!user) {
      sendJson(response, 401, { error: "Login required." });
      return;
    }
    sendJson(response, 200, secureMessageEnrollment(user));
    return;
  }

  if (pathname === "/api/secure-message/access" && request.method === "POST") {
    const user = currentUser(request);
    if (!user) {
      sendJson(response, 401, { error: "Login required." });
      return;
    }
    const now = new Date().toISOString();
    secureMessageRequests.set(user.id, {
      requestedAt: now,
      status: isPreviewAdmin(user) ? "approved" : "pending",
      username: user.username
    });
    if (isPreviewAdmin(user)) {
      secureMessageAccess.set(user.id, {
        active: true,
        grantedAt: now,
        grantedBy: user.username,
        username: user.username
      });
    }
    sendJson(response, 200, secureMessageEnrollment(user));
    return;
  }

  if (pathname === "/api/secure-message/send" && request.method === "POST") {
    const user = currentUser(request);
    if (!user) {
      sendJson(response, 401, { error: "Login required." });
      return;
    }
    if (!secureMessageEnrollment(user).allowed) {
      sendJson(response, 403, { error: "Secure Message access required." });
      return;
    }
    const body = await readBody(request);
    const event = {
      id: crypto.randomUUID(),
      userId: user.id,
      username: user.username,
      event: "send",
      messageBytes: Math.max(0, Math.min(20000, Math.floor(Number(body.messageBytes) || 0))),
      ciphertextBytes: Math.max(0, Math.min(50000, Math.floor(Number(body.ciphertextBytes) || 0))),
      ipAddress: normalizePreviewIp(request.socket.remoteAddress || ""),
      userAgent: request.headers["user-agent"] || "",
      createdAt: new Date().toISOString()
    };
    secureMessageEvents.unshift(event);
    sendJson(response, 200, { logged: true, createdAt: event.createdAt });
    return;
  }

  if (pathname === "/api/arcade/leaderboard" && request.method === "POST") {
    const user = currentUser(request);
    if (!user) {
      sendJson(response, 401, { error: "Login required." });
      return;
    }

    const body = await readBody(request);
    const score = Math.max(0, Math.min(999999, Math.floor(Number(body.score) || 0)));
    if (!score) {
      sendJson(response, 400, { error: "Score must be greater than zero." });
      return;
    }

    const current = arcadeScores.get(user.id);
    const now = new Date().toISOString();
    if (!current || score > current.score) {
      arcadeScores.set(user.id, {
        score,
        updatedAt: now,
        username: user.username
      });
    } else {
      current.username = user.username;
    }

    sendJson(response, 200, { scores: getPreviewArcadeScores() });
    return;
  }

  if (pathname === "/api/admin/events" && request.method === "GET") {
    const user = currentUser(request);
    if (!user) {
      sendJson(response, 401, { error: "Login required." });
      return;
    }
    if (!isPreviewAdmin(user)) {
      sendJson(response, 403, { error: "Admin access required." });
      return;
    }
    sendJson(response, 200, { events: authEvents.slice(0, 200) });
    return;
  }

  if (pathname === "/api/admin/world-news" && request.method === "GET") {
    const user = currentUser(request);
    if (!user) {
      sendJson(response, 401, { error: "Login required." });
      return;
    }
    if (!isPreviewAdmin(user)) {
      sendJson(response, 403, { error: "Admin access required." });
      return;
    }
    sendJson(response, 200, getPreviewWorldNewsAdmin());
    return;
  }

  if (pathname === "/api/admin/world-news" && request.method === "POST") {
    const admin = currentUser(request);
    if (!admin || !isPreviewAdmin(admin)) {
      sendJson(response, admin ? 403 : 401, { error: admin ? "Admin access required." : "Login required." });
      return;
    }
    const body = await readBody(request);
    const username = normalizeUsername(body.username);
    const target = [...users.values()].find((item) => item.username === username);
    if (!target) {
      sendJson(response, 404, { error: "User not found." });
      return;
    }
    const now = new Date().toISOString();
    worldNewsAccess.set(target.id, {
      active: true,
      grantedAt: now,
      grantedBy: admin.username,
      username: target.username
    });
    worldNewsRequests.set(target.id, {
      requestedAt: worldNewsRequests.get(target.id)?.requestedAt || now,
      reviewedAt: now,
      reviewedBy: admin.username,
      status: "approved",
      username: target.username
    });
    sendJson(response, 200, { granted: true, username: target.username, grantedAt: now });
    return;
  }

  if (pathname === "/api/admin/world-news" && request.method === "DELETE") {
    const admin = currentUser(request);
    if (!admin || !isPreviewAdmin(admin)) {
      sendJson(response, admin ? 403 : 401, { error: admin ? "Admin access required." : "Login required." });
      return;
    }
    const body = await readBody(request);
    const username = normalizeUsername(body.username);
    const entry = [...worldNewsAccess.entries()].find(([, value]) => value.username === username);
    const targetRequest = [...worldNewsRequests.entries()].find(([, value]) => value.username === username);
    const now = new Date().toISOString();
    if (entry) {
      entry[1].active = false;
      entry[1].revokedAt = now;
      entry[1].revokedBy = admin.username;
      worldNewsAccess.set(entry[0], entry[1]);
    }
    if (targetRequest) {
      worldNewsRequests.set(targetRequest[0], {
        ...targetRequest[1],
        reviewedAt: now,
        reviewedBy: admin.username,
        status: "denied",
        username
      });
    }
    sendJson(response, 200, { denied: Boolean(entry || targetRequest), username, deniedAt: now });
    return;
  }

  if (pathname === "/api/admin/secure-messages" && request.method === "GET") {
    const user = currentUser(request);
    if (!user) {
      sendJson(response, 401, { error: "Login required." });
      return;
    }
    if (!isPreviewAdmin(user)) {
      sendJson(response, 403, { error: "Admin access required." });
      return;
    }
    sendJson(response, 200, getPreviewSecureMessageAdmin());
    return;
  }

  if (pathname === "/api/admin/secure-messages" && request.method === "POST") {
    const admin = currentUser(request);
    if (!admin || !isPreviewAdmin(admin)) {
      sendJson(response, admin ? 403 : 401, { error: admin ? "Admin access required." : "Login required." });
      return;
    }
    const body = await readBody(request);
    const username = normalizeUsername(body.username);
    const target = [...users.values()].find((item) => item.username === username);
    if (!target) {
      sendJson(response, 404, { error: "User not found." });
      return;
    }
    const now = new Date().toISOString();
    secureMessageAccess.set(target.id, {
      active: true,
      grantedAt: now,
      grantedBy: admin.username,
      username: target.username
    });
    secureMessageRequests.set(target.id, {
      requestedAt: secureMessageRequests.get(target.id)?.requestedAt || now,
      reviewedAt: now,
      reviewedBy: admin.username,
      status: "approved",
      username: target.username
    });
    sendJson(response, 200, { granted: true, username: target.username, grantedAt: now });
    return;
  }

  if (pathname === "/api/admin/secure-messages" && request.method === "DELETE") {
    const admin = currentUser(request);
    if (!admin || !isPreviewAdmin(admin)) {
      sendJson(response, admin ? 403 : 401, { error: admin ? "Admin access required." : "Login required." });
      return;
    }
    const body = await readBody(request);
    const username = normalizeUsername(body.username);
    const entry = [...secureMessageAccess.entries()].find(([, value]) => value.username === username);
    if (entry) {
      entry[1].active = false;
      entry[1].revokedAt = new Date().toISOString();
      entry[1].revokedBy = admin.username;
      secureMessageAccess.set(entry[0], entry[1]);
      const requestEntry = secureMessageRequests.get(entry[0]) || { requestedAt: entry[1].grantedAt, username };
      secureMessageRequests.set(entry[0], {
        ...requestEntry,
        reviewedAt: entry[1].revokedAt,
        reviewedBy: admin.username,
        status: "revoked",
        username
      });
    }
    sendJson(response, 200, { revoked: Boolean(entry), username, revokedAt: new Date().toISOString() });
    return;
  }

  if (pathname === "/api/profile" && request.method === "GET") {
    const user = currentUser(request);
    if (!user) {
      sendJson(response, 401, { error: "Login required." });
      return;
    }
    sendJson(response, 200, { profile: getPreviewProfile(user) });
    return;
  }

  if (pathname === "/api/profile" && request.method === "POST") {
    const user = currentUser(request);
    if (!user) {
      sendJson(response, 401, { error: "Login required." });
      return;
    }
    const body = await readBody(request);
    const profile = {
      username: user.username,
      avatarUrl: normalizeAvatarUrl(body.avatarUrl),
      about: String(body.about || "").trim().slice(0, 280),
      updatedAt: new Date().toISOString()
    };
    profiles.set(user.username, profile);
    sendJson(response, 200, { profile });
    return;
  }

  if (pathname === "/api/profile/password" && request.method === "POST") {
    const sessionUser = currentUser(request);
    if (!sessionUser) {
      sendJson(response, 401, { error: "Login required." });
      return;
    }
    const body = await readBody(request);
    const user = users.get(sessionUser.id);
    if (!user || !verifyPassword(String(body.currentPassword || ""), user.password)) {
      sendJson(response, 401, { error: "Current password is wrong." });
      return;
    }
    const nextPassword = String(body.newPassword || "");
    if (nextPassword.length < 8) {
      sendJson(response, 400, { error: "Passwords need at least 8 characters." });
      return;
    }
    user.password = hashPassword(nextPassword);
    users.set(user.id, user);
    sendJson(response, 200, { updated: true });
    return;
  }

  const publicProfileMatch = pathname.match(/^\/api\/profile\/([^/]+)$/);
  if (publicProfileMatch && request.method === "GET") {
    const username = normalizeUsername(decodeURIComponent(publicProfileMatch[1]));
    const user = [...users.values()].find((item) => item.username === username);
    if (!user) {
      sendJson(response, 404, { error: "Profile not found." });
      return;
    }
    sendJson(response, 200, { profile: getPreviewProfile(user) });
    return;
  }

  if (pathname === "/api/register" && request.method === "POST") {
    const body = await readBody(request);
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");
    if (!verifyCaptcha(body.captchaToken, body.captchaAnswer)) {
      logPreviewAuthEvent(request, { event: "register", username, success: false, client: body.client, failureReason: "captcha_failed" });
      sendJson(response, 400, { error: "Linje check answer is wrong or expired." });
      return;
    }

    if (!/^[a-z0-9_]{1,24}$/.test(username)) {
      logPreviewAuthEvent(request, { event: "register", username, success: false, client: body.client, failureReason: "invalid_username" });
      sendJson(response, 400, { error: "Usernames need 1-24 letters, numbers, or underscores." });
      return;
    }

    if (isBlockedUsername(username)) {
      logPreviewAuthEvent(request, { event: "register", username, success: false, client: body.client, failureReason: "blocked_username" });
      sendJson(response, 400, { error: "Choose a different username." });
      return;
    }

    if (password.length < 8) {
      logPreviewAuthEvent(request, { event: "register", username, success: false, client: body.client, failureReason: "weak_password" });
      sendJson(response, 400, { error: "Passwords need at least 8 characters." });
      return;
    }

    if ([...users.values()].some((user) => user.username === username)) {
      logPreviewAuthEvent(request, { event: "register", username, success: false, client: body.client, failureReason: "username_taken" });
      sendJson(response, 409, { error: "That username is already taken." });
      return;
    }

    const user = {
      id: crypto.randomUUID(),
      username,
      password: hashPassword(password),
      createdAt: new Date().toISOString()
    };
    users.set(user.id, user);
    logPreviewAuthEvent(request, { event: "register", userId: user.id, username, success: true, client: body.client });
    createPreviewSession(response, publicUser(user));
    return;
  }

  if (pathname === "/api/login" && request.method === "POST") {
    const body = await readBody(request);
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");
    if (!verifyCaptcha(body.captchaToken, body.captchaAnswer)) {
      logPreviewAuthEvent(request, { event: "login", username, success: false, client: body.client, failureReason: "captcha_failed" });
      sendJson(response, 400, { error: "Linje check answer is wrong or expired." });
      return;
    }

    const user = [...users.values()].find((item) => item.username === username && verifyPassword(password, item.password));

    if (!user) {
      logPreviewAuthEvent(request, { event: "login", username, success: false, client: body.client, failureReason: "bad_credentials" });
      sendJson(response, 401, { error: "Username or password is wrong." });
      return;
    }

    logPreviewAuthEvent(request, { event: "login", userId: user.id, username, success: true, client: body.client });
    createPreviewSession(response, publicUser(user));
    return;
  }

  if (pathname === "/api/logout" && request.method === "POST") {
    const sessionId = getCookie(request, "linje_session");
    if (sessionId) sessions.delete(sessionId);
    sendJson(response, 200, { authenticated: false }, {
      "set-cookie": "linje_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
    });
    return;
  }

  sendJson(response, 404, { error: "not found" });
}

function createPreviewSession(response, user) {
  const sessionId = crypto.randomBytes(32).toString("hex");
  sessions.set(sessionId, user);
  sendJson(response, 200, { authenticated: true, user }, {
    "set-cookie": `linje_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
  });
}

function currentUser(request) {
  const sessionId = getCookie(request, "linje_session");
  return sessionId ? sessions.get(sessionId) || null : null;
}

function getPreviewProfile(user) {
  return profiles.get(user.username) || {
    username: user.username,
    avatarUrl: "",
    about: "",
    updatedAt: user.createdAt
  };
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    admin: isPreviewAdmin(user),
    createdAt: user.createdAt
  };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(String(password || ""), salt, PASSWORD_ITERATIONS, 32, "sha256");
  return {
    hash: hash.toString("base64"),
    iterations: PASSWORD_ITERATIONS,
    salt: salt.toString("base64")
  };
}

function verifyPassword(password, stored) {
  if (!stored || !stored.hash || !stored.salt) return false;
  const salt = Buffer.from(stored.salt, "base64");
  const hash = crypto.pbkdf2Sync(String(password || ""), salt, Number(stored.iterations) || 1, 32, "sha256");
  const expected = Buffer.from(stored.hash, "base64");
  return hash.length === expected.length && crypto.timingSafeEqual(hash, expected);
}

function secureMessageEnrollment(user) {
  const request = secureMessageRequests.get(user.id);
  const grant = secureMessageAccess.get(user.id);
  const allowed = isPreviewAdmin(user) || Boolean(grant && grant.active);
  return {
    admin: isPreviewAdmin(user),
    allowed,
    grantedAt: grant && grant.active ? grant.grantedAt : "",
    registered: Boolean(request || grant || isPreviewAdmin(user)),
    requestedAt: request ? request.requestedAt : "",
    status: allowed ? "approved" : request ? request.status : "not_registered",
    username: user.username
  };
}

function getPreviewSecureMessageAdmin() {
  const grants = [...secureMessageAccess.entries()].map(([userId, grant]) => {
    const sends = secureMessageEvents.filter((event) => event.userId === userId);
    const request = secureMessageRequests.get(userId);
    const status = grant.active ? "approved" : request?.status || "revoked";
    return {
      userId,
      username: grant.username,
      grantedBy: grant.grantedBy || "",
      grantedAt: grant.grantedAt || "",
      revokedBy: grant.revokedBy || "",
      revokedAt: grant.revokedAt || "",
      active: Boolean(grant.active),
      requestedAt: request?.requestedAt || "",
      sendCount: sends.length,
      status,
      lastSentAt: sends[0]?.createdAt || ""
    };
  });
  secureMessageRequests.forEach((request, userId) => {
    if (secureMessageAccess.has(userId)) return;
    grants.push({
      userId,
      username: request.username,
      grantedBy: "",
      grantedAt: request.requestedAt,
      revokedBy: "",
      revokedAt: "",
      active: false,
      status: request.status || "pending",
      sendCount: 0,
      lastSentAt: ""
    });
  });
  return {
    grants,
    events: secureMessageEvents.slice(0, 100)
  };
}

function normalizeUsername(username) {
  return String(username || "").trim().replace(/^@+/, "").toLowerCase();
}

function isPreviewAdmin(user) {
  const admins = String(process.env.ADMIN_USERS || "seb")
    .split(",")
    .map((item) => normalizeUsername(item))
    .filter(Boolean);
  return Boolean(user && admins.includes(user.username));
}

function worldNewsEnrollment(user) {
  const request = worldNewsRequests.get(user.id);
  const grant = worldNewsAccess.get(user.id);
  const allowed = isPreviewAdmin(user) || Boolean(grant && grant.active);
  return {
    admin: isPreviewAdmin(user),
    allowed,
    grantedAt: grant && grant.active ? grant.grantedAt : "",
    registered: Boolean(request || grant || isPreviewAdmin(user)),
    requestedAt: request ? request.requestedAt : "",
    status: allowed ? "approved" : request ? request.status : "not_registered",
    username: user.username
  };
}

function getPreviewWorldNewsAdmin() {
  const grants = [...worldNewsRequests.entries()].map(([userId, request]) => {
    const grant = worldNewsAccess.get(userId);
    const active = Boolean(grant && grant.active);
    return {
      userId,
      username: request.username,
      requestedAt: request.requestedAt || "",
      reviewedBy: request.reviewedBy || "",
      reviewedAt: request.reviewedAt || "",
      grantedBy: grant?.grantedBy || "",
      grantedAt: grant?.grantedAt || "",
      revokedBy: grant?.revokedBy || "",
      revokedAt: grant?.revokedAt || "",
      active,
      status: active ? "approved" : request.status || "pending"
    };
  });
  return { grants };
}

const previewNewsDomains = [
  "reuters.com",
  "apnews.com",
  "bbc.com",
  "aljazeera.com",
  "france24.com",
  "dw.com",
  "theguardian.com",
  "scmp.com",
  "japantimes.co.jp",
  "thehindu.com",
  "timesofindia.indiatimes.com",
  "lemonde.fr"
];
const previewRssFeeds = [
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", domain: "bbc.com", sourceCountry: "United Kingdom" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", domain: "aljazeera.com", sourceCountry: "Qatar" },
  { url: "https://www.france24.com/en/rss", domain: "france24.com", sourceCountry: "France" },
  { url: "https://rss.dw.com/rdf/rss-en-all", domain: "dw.com", sourceCountry: "Germany" },
  { url: "https://www.theguardian.com/world/rss", domain: "theguardian.com", sourceCountry: "United Kingdom" }
];
const previewPlaces = [
  { name: "Tehran", aliases: ["tehran"], country: "Iran", region: "Middle East", lat: 35.6892, lon: 51.389, population: 9380000, kind: "capital" },
  { name: "London", aliases: ["london"], country: "United Kingdom", region: "Europe", lat: 51.5072, lon: -0.1276, population: 8799800, kind: "capital" },
  { name: "Paris", aliases: ["paris"], country: "France", region: "Europe", lat: 48.8566, lon: 2.3522, population: 2103000, kind: "capital" },
  { name: "Berlin", aliases: ["berlin"], country: "Germany", region: "Europe", lat: 52.52, lon: 13.405, population: 3878000, kind: "capital" },
  { name: "Kyiv", aliases: ["kyiv", "kiev"], country: "Ukraine", region: "Europe", lat: 50.4501, lon: 30.5234, population: 2952300, kind: "capital" },
  { name: "Moscow", aliases: ["moscow"], country: "Russia", region: "Eurasia", lat: 55.7558, lon: 37.6173, population: 13010000, kind: "capital" },
  { name: "Beijing", aliases: ["beijing"], country: "China", region: "East Asia", lat: 39.9042, lon: 116.4074, population: 21893000, kind: "capital" },
  { name: "Tokyo", aliases: ["tokyo"], country: "Japan", region: "East Asia", lat: 35.6762, lon: 139.6503, population: 14094000, kind: "capital" },
  { name: "New Delhi", aliases: ["new delhi", "delhi"], country: "India", region: "South Asia", lat: 28.6139, lon: 77.209, population: 11000000, kind: "capital" },
  { name: "Gaza City", aliases: ["gaza city", "gaza"], country: "Palestine", region: "Middle East", lat: 31.5017, lon: 34.4668, population: 590000, kind: "city" },
  { name: "Dubai", aliases: ["dubai"], country: "United Arab Emirates", region: "Middle East", lat: 25.2048, lon: 55.2708, population: 3550000, kind: "city" },
  { name: "Cairo", aliases: ["cairo"], country: "Egypt", region: "Africa", lat: 30.0444, lon: 31.2357, population: 10100000, kind: "capital" },
  { name: "Lagos", aliases: ["lagos"], country: "Nigeria", region: "West Africa", lat: 6.5244, lon: 3.3792, population: 15300000, kind: "city" },
  { name: "Washington", aliases: ["washington", "washington dc"], country: "United States", region: "North America", lat: 38.9072, lon: -77.0369, population: 678000, kind: "capital" },
  { name: "New York", aliases: ["new york", "nyc"], country: "United States", region: "North America", lat: 40.7128, lon: -74.006, population: 8258000, kind: "city" },
  { name: "Sao Paulo", aliases: ["sao paulo"], country: "Brazil", region: "South America", lat: -23.5558, lon: -46.6396, population: 11450000, kind: "city" },
  { name: "Sydney", aliases: ["sydney"], country: "Australia", region: "Oceania", lat: -33.8688, lon: 151.2093, population: 5297000, kind: "city" },
  { name: "Jakarta", aliases: ["jakarta"], country: "Indonesia", region: "Southeast Asia", lat: -6.2088, lon: 106.8456, population: 10670000, kind: "capital" }
];
const previewSourceLocations = {
  australia: { name: "Australia", country: "Australia", region: "Oceania", lat: -35.3, lon: 149.1, population: 0, kind: "country centroid" },
  brazil: { name: "Brazil", country: "Brazil", region: "South America", lat: -15.8, lon: -47.9, population: 0, kind: "country centroid" },
  china: { name: "China", country: "China", region: "East Asia", lat: 39.9, lon: 116.4, population: 0, kind: "country centroid" },
  france: { name: "France", country: "France", region: "Europe", lat: 48.9, lon: 2.4, population: 0, kind: "country centroid" },
  germany: { name: "Germany", country: "Germany", region: "Europe", lat: 52.5, lon: 13.4, population: 0, kind: "country centroid" },
  india: { name: "India", country: "India", region: "South Asia", lat: 28.6, lon: 77.2, population: 0, kind: "country centroid" },
  japan: { name: "Japan", country: "Japan", region: "East Asia", lat: 35.7, lon: 139.7, population: 0, kind: "country centroid" },
  qatar: { name: "Qatar", country: "Qatar", region: "Middle East", lat: 25.3, lon: 51.5, population: 0, kind: "country centroid" },
  unitedkingdom: { name: "United Kingdom", country: "United Kingdom", region: "Europe", lat: 51.5, lon: -0.1, population: 0, kind: "country centroid" },
  unitedstates: { name: "United States", country: "United States", region: "North America", lat: 38.9, lon: -77, population: 0, kind: "country centroid" }
};
const previewMaritimeBoxes = [
  { name: "Strait of Hormuz", box: [[25.25, 55.7], [27.2, 57.4]], traffic: "energy chokepoint" },
  { name: "Suez Canal", box: [[29.8, 31.9], [31.4, 32.8]], traffic: "Europe-Asia corridor" },
  { name: "Strait of Malacca", box: [[1.0, 99.0], [4.6, 104.5]], traffic: "Asia-Europe trade lane" },
  { name: "Singapore Strait", box: [[1.05, 103.2], [1.55, 104.25]], traffic: "dense port approach" },
  { name: "English Channel", box: [[49.2, -5.9], [51.8, 2.0]], traffic: "North Atlantic-Europe shipping" },
  { name: "Gibraltar", box: [[35.6, -6.2], [36.6, -4.6]], traffic: "Atlantic-Mediterranean gate" }
];

async function getPreviewWorldNews() {
  const updatedAt = new Date().toISOString();
  const [articlesResult, flights, ships] = await Promise.allSettled([
    getPreviewGdeltArticles(),
    getPreviewFlights(),
    getPreviewShips()
  ]);
  const articles = articlesResult.status === "fulfilled" ? articlesResult.value : [];
  const regions = [...articles.reduce((items, article) => {
    const current = items.get(article.region) || { count: 0, latestAt: "" };
    current.count += 1;
    current.latestAt = !current.latestAt || article.seenAt > current.latestAt ? article.seenAt : current.latestAt;
    items.set(article.region, current);
    return items;
  }, new Map()).entries()].map(([region, value]) => ({ region, ...value }));

  return {
    articles,
    flights: flights.status === "fulfilled" ? flights.value : { source: "OpenSky Network", status: "unavailable", updatedAt, aircraft: [] },
    places: articles.map((article) => ({ ...article.place, articleCount: 1, articles: [{ id: article.id, title: article.title, url: article.url, domain: article.domain }] })),
    regions,
    ships: ships.status === "fulfilled" ? ships.value : { source: "AISStream", status: "unavailable", updatedAt, vessels: [], lanes: previewMaritimeLanes() },
    source: "GDELT DOC 2.0 / OpenSky / AISStream",
    status: articles.length ? "live" : "No GDELT articles returned for the selected provider window.",
    updatedAt
  };
}

async function getPreviewGdeltArticles() {
  const query = previewNewsDomains.map((domain) => `domainis:${domain}`).join(" OR ");
  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", `(${query})`);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("format", "json");
  url.searchParams.set("timespan", "48h");
  url.searchParams.set("maxrecords", "80");
  url.searchParams.set("sort", "datedesc");
  try {
    const response = await fetch(url, { headers: { "user-agent": "linje-world-watch-preview" } });
    if (response.ok) {
      const data = await response.json();
      const articles = (data.articles || []).map(normalizePreviewArticle).filter(Boolean).slice(0, 60);
      if (articles.length) return [...await getPreviewOpenEvents(), ...articles].slice(0, 140);
    }
  } catch {}
  const rssResults = await Promise.allSettled(previewRssFeeds.map(getPreviewRssArticles));
  return [
    ...await getPreviewOpenEvents(),
    ...rssResults.flatMap((result) => result.status === "fulfilled" ? result.value : [])
  ].slice(0, 140);
}

function normalizePreviewArticle(article) {
  const place = inferPreviewPlace(article);
  if (!place || !article.url || !article.title) return null;
  return {
    id: `ww-${crypto.createHash("sha1").update(article.url).digest("hex").slice(0, 12)}`,
    title: String(article.title).slice(0, 180),
    url: article.url,
    domain: String(article.domain || "").slice(0, 120),
    language: String(article.language || "").slice(0, 40),
    sourceCountry: place.country,
    place,
    placeName: place.name,
    region: place.region,
    lat: place.lat,
    lon: place.lon,
    seenAt: normalizePreviewGdeltDate(article.seendate || article.pubDate || "") || new Date().toISOString(),
    image: article.socialimage || ""
  };
}

function inferPreviewPlace(article) {
  const haystack = `${article.title || ""} ${article.description || ""}`.toLowerCase();
  const direct = previewPlaces.find((place) => place.aliases.some((alias) => haystack.includes(alias)));
  if (direct) return direct;
  const key = String(article.sourcecountry || "").toLowerCase().replace(/[^a-z]/g, "");
  if (previewSourceLocations[key]) return previewSourceLocations[key];
  const domain = String(article.domain || "").toLowerCase();
  if (domain.includes("bbc") || domain.includes("guardian")) return previewPlaces[1];
  if (domain.includes("lemonde")) return previewPlaces[2];
  if (domain.includes("dw.com")) return previewPlaces[3];
  if (domain.includes("scmp")) return previewPlaces[6];
  if (domain.includes("japantimes")) return previewPlaces[7];
  if (domain.includes("thehindu") || domain.includes("timesofindia")) return previewPlaces[8];
  return previewPlaces[13];
}

async function getPreviewOpenEvents() {
  const results = await Promise.allSettled([
    getPreviewUsgsEarthquakes(),
    getPreviewEonetEvents()
  ]);
  return results.flatMap((result) => result.status === "fulfilled" ? result.value : []).slice(0, 68);
}

async function getPreviewUsgsEarthquakes() {
  const response = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson", { headers: { "user-agent": "linje-world-watch-preview" } });
  if (!response.ok) return [];
  const data = await response.json();
  return (data.features || []).map((feature) => {
    const [lon, lat] = feature.geometry?.coordinates || [];
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return null;
    const mag = Number(feature.properties?.mag) || 0;
    const placeName = String(feature.properties?.place || "USGS earthquake").slice(0, 120);
    const region = inferPreviewRegion(Number(lat), Number(lon));
    return {
      id: `usgs-${feature.id}`,
      title: `M${mag.toFixed(1)} earthquake - ${placeName}`,
      url: feature.properties?.url || "https://earthquake.usgs.gov/earthquakes/map/",
      domain: "earthquake.usgs.gov",
      language: "English",
      sourceCountry: region,
      place: { name: placeName, country: region, region, lat: Number(lat), lon: Number(lon), population: 0, kind: "seismic event" },
      placeName,
      region,
      lat: Number(lat),
      lon: Number(lon),
      seenAt: feature.properties?.time ? new Date(feature.properties.time).toISOString() : new Date().toISOString(),
      signalType: "earthquake",
      magnitude: mag
    };
  }).filter(Boolean).slice(0, 34);
}

async function getPreviewEonetEvents() {
  const response = await fetch("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=40", { headers: { "user-agent": "linje-world-watch-preview" } });
  if (!response.ok) return [];
  const data = await response.json();
  return (data.events || []).map((event) => {
    const geometry = [...(event.geometry || [])].reverse().find((item) => item?.coordinates);
    const point = previewEventPoint(geometry?.coordinates);
    if (!point) return null;
    const category = event.categories?.[0]?.title || "Natural event";
    const region = inferPreviewRegion(point.lat, point.lon);
    return {
      id: `eonet-${event.id}`,
      title: `${category} - ${event.title || "NASA EONET event"}`.slice(0, 180),
      url: event.link || "https://eonet.gsfc.nasa.gov/",
      domain: "eonet.gsfc.nasa.gov",
      language: "English",
      sourceCountry: region,
      place: { name: event.title || category, country: region, region, lat: point.lat, lon: point.lon, population: 0, kind: category.toLowerCase() },
      placeName: event.title || category,
      region,
      lat: point.lat,
      lon: point.lon,
      seenAt: geometry?.date || new Date().toISOString(),
      signalType: "natural event",
      category
    };
  }).filter(Boolean).slice(0, 34);
}

function previewEventPoint(coordinates) {
  if (!Array.isArray(coordinates)) return null;
  if (Number.isFinite(Number(coordinates[0])) && Number.isFinite(Number(coordinates[1]))) return { lon: Number(coordinates[0]), lat: Number(coordinates[1]) };
  const points = previewFlattenCoordinates(coordinates).filter((point) => Number.isFinite(point.lon) && Number.isFinite(point.lat));
  if (!points.length) return null;
  return {
    lon: points.reduce((sum, point) => sum + point.lon, 0) / points.length,
    lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length
  };
}

function previewFlattenCoordinates(value) {
  if (!Array.isArray(value)) return [];
  if (Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]))) return [{ lon: Number(value[0]), lat: Number(value[1]) }];
  return value.flatMap(previewFlattenCoordinates);
}

function inferPreviewRegion(lat, lon) {
  if (lat >= 15 && lon >= -170 && lon <= -30) return "North America";
  if (lat < 15 && lon >= -90 && lon <= -30) return "South America";
  if (lon >= -25 && lon <= 45 && lat >= 35) return "Europe";
  if (lon >= -20 && lon <= 55 && lat < 35 && lat > -40) return "Africa";
  if (lon >= 25 && lon <= 65 && lat >= 10 && lat <= 42) return "Middle East";
  if (lon >= 45 && lon <= 155 && lat >= -10) return "Asia";
  if (lon >= 95 && lon <= 180 && lat < -10) return "Oceania";
  return "Global";
}

async function getPreviewRssArticles(feed) {
  const response = await fetch(feed.url, { headers: { "user-agent": "linje-world-watch-preview" } });
  if (!response.ok) return [];
  const xml = await response.text();
  return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => {
    const title = previewXmlText(match[0], "title");
    const link = previewXmlText(match[0], "link") || previewXmlText(match[0], "guid");
    if (!title || !link) return null;
    return normalizePreviewArticle({
      title,
      url: link,
      domain: feed.domain,
      sourcecountry: feed.sourceCountry,
      description: previewXmlText(match[0], "description"),
      pubDate: previewXmlText(match[0], "pubDate") || previewXmlText(match[0], "dc:date"),
      seendate: "",
      language: "English",
      socialimage: ""
    });
  }).filter(Boolean);
}

function previewXmlText(xml, tag) {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(new RegExp(`<${escapedTag}[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`, "i"));
  if (!match) return "";
  return String(match[1])
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .trim();
}

async function getPreviewFlights() {
  try {
    const token = await getPreviewOpenSkyAccessToken();
    const headers = { "user-agent": "linje-world-watch-preview" };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch("https://opensky-network.org/api/states/all", { headers });
    if (!response.ok) throw new Error(`OpenSky ${response.status}`);
    const data = await response.json();
    return {
      source: "OpenSky Network",
      status: token ? "live OAuth" : "live anonymous",
      updatedAt: data.time ? new Date(data.time * 1000).toISOString() : new Date().toISOString(),
      aircraft: (data.states || []).filter((state) => Number.isFinite(state[5]) && Number.isFinite(state[6])).slice(0, 140).map((state) => ({
        id: state[0],
        callsign: String(state[1] || "").trim() || state[0],
        originCountry: state[2] || "",
        lastContact: state[4] ? new Date(state[4] * 1000).toISOString() : "",
        lon: state[5],
        lat: state[6],
        altitudeMeters: state[7] ?? state[13] ?? null,
        onGround: Boolean(state[8]),
        speedMps: state[9] ?? null,
        track: state[10] ?? null,
        verticalRate: state[11] ?? null
      }))
    };
  } catch (error) {
    return { source: "OpenSky Network", status: error.message || "unavailable", updatedAt: new Date().toISOString(), aircraft: [] };
  }
}

async function getPreviewOpenSkyAccessToken() {
  const clientId = String(process.env.OPENSKY_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.OPENSKY_CLIENT_SECRET || "").trim();
  if (!clientId || !clientSecret) return "";

  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);

  const response = await fetch("https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "linje-world-watch-preview"
    },
    body
  });
  if (!response.ok) return "";
  const data = await response.json().catch(() => ({}));
  return typeof data.access_token === "string" ? data.access_token : "";
}

async function getPreviewShips() {
  const key = String(process.env.AISSTREAM_KEY || process.env.AISSTREAM_API_KEY || "").trim();
  if (!key) return { source: "AISStream", status: "set AISSTREAM_KEY locally for live vessel positions", updatedAt: new Date().toISOString(), vessels: [], lanes: previewMaritimeLanes() };
  if (typeof WebSocket === "undefined") return { source: "AISStream", status: "Node runtime does not expose outbound WebSocket", updatedAt: new Date().toISOString(), vessels: [], lanes: previewMaritimeLanes() };
  return new Promise((resolve) => {
    const vessels = new Map();
    let settled = false;
    let socket;
    const finish = (status) => {
      if (settled) return;
      settled = true;
      try {
        if (socket && socket.readyState < 2) socket.close();
      } catch {}
      resolve({ source: "AISStream", status: vessels.size ? status || "live" : status || "no vessel position reports received in sample window", updatedAt: new Date().toISOString(), vessels: [...vessels.values()].slice(0, 90), lanes: previewMaritimeLanes() });
    };
    const timer = setTimeout(() => finish(vessels.size ? "live sample" : "no vessel position reports received in sample window"), 4500);
    try {
      socket = new WebSocket("wss://stream.aisstream.io/v0/stream");
      socket.addEventListener("open", () => socket.send(JSON.stringify({ APIKey: key, BoundingBoxes: previewMaritimeBoxes.map((item) => item.box), FilterMessageTypes: ["PositionReport"] })));
      socket.addEventListener("message", async (event) => {
        const vessel = normalizePreviewAis(await readPreviewAisPayload(event.data));
        if (!vessel) return;
        vessels.set(vessel.id, { ...(vessels.get(vessel.id) || {}), ...vessel });
        if (vessels.size >= 90) {
          clearTimeout(timer);
          finish("live");
        }
      });
      socket.addEventListener("error", () => {
        clearTimeout(timer);
        finish(vessels.size ? "live sample; AISStream closed with an error" : "AISStream connection error");
      });
      socket.addEventListener("close", () => {
        clearTimeout(timer);
        finish(vessels.size ? "live sample" : "AISStream connection closed before vessel data arrived");
      });
    } catch (error) {
      clearTimeout(timer);
      finish(error.message || "AISStream unavailable");
    }
  });
}

function normalizePreviewAis(raw) {
  try {
    const payload = JSON.parse(String(raw || ""));
    const meta = payload.MetaData || {};
    const message = payload.Message || {};
    const position = message.PositionReport || {};
    const voyage = message.VoyageData || {};
    const lat = Number(position.Latitude ?? meta.latitude ?? meta.Latitude);
    const lon = Number(position.Longitude ?? meta.longitude ?? meta.Longitude);
    const mmsi = String(meta.MMSI_String || meta.MMSI || position.UserID || voyage.UserID || "").trim();
    if (!mmsi || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return {
      id: `ais-${mmsi}`,
      mmsi,
      name: String(meta.ShipName || voyage.Name || "").replace(/\s+/g, " ").trim().slice(0, 80),
      callsign: String(meta.CallSign || voyage.CallSign || "").replace(/\s+/g, " ").trim().slice(0, 80),
      destination: String(meta.Destination || voyage.Destination || "").replace(/\s+/g, " ").trim().slice(0, 80),
      flag: String(meta.Country || meta.Flag || "").replace(/\s+/g, " ").trim().slice(0, 80),
      lat,
      lon,
      speedKnots: Number.isFinite(Number(position.Sog)) ? Number(position.Sog) : null,
      course: Number.isFinite(Number(position.Cog)) ? Number(position.Cog) : null,
      heading: Number.isFinite(Number(position.TrueHeading)) ? Number(position.TrueHeading) : null,
      navigationStatus: String(position.NavigationalStatus || "").trim(),
      lastSeenAt: new Date().toISOString(),
      source: "AISStream"
    };
  } catch {
    return null;
  }
}

async function readPreviewAisPayload(raw) {
  if (typeof raw === "string") return raw;
  if (raw && typeof raw.text === "function") return raw.text();
  if (raw && typeof raw.arrayBuffer === "function") return new TextDecoder().decode(await raw.arrayBuffer());
  return String(raw || "");
}

function previewMaritimeLanes() {
  return previewMaritimeBoxes.map((item) => {
    const [[latA, lonA], [latB, lonB]] = item.box;
    return { name: item.name, lat: (latA + latB) / 2, lon: (lonA + lonB) / 2, traffic: item.traffic };
  });
}

function normalizePreviewGdeltDate(value) {
  const text = String(value || "");
  const match = text.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  return match ? `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z` : text;
}

function normalizeAvatarUrl(value) {
  const input = String(value || "").trim().slice(0, 2000);
  if (!input) return "";
  try {
    const url = new URL(input);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function isBlockedUsername(username) {
  const compact = normalizeForModeration(username);
  return blockedUsernameTerms.some((term) => compact.includes(term));
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

function logPreviewAuthEvent(request, { event, userId = "", username = "", success, client = {}, failureReason = "" }) {
  const record = {
    id: crypto.randomUUID(),
    event,
    userId,
    username,
    success,
    failureReason,
    ipAddress: normalizePreviewIp(request.socket.remoteAddress || ""),
    userAgent: request.headers["user-agent"] || "",
    country: "local",
    colo: "local",
    asn: "",
    metadata: {
      acceptLanguage: request.headers["accept-language"] || "",
      cfRay: "",
      city: "local",
      continent: "",
      latitude: "",
      longitude: "",
      postalCode: "",
      region: "local",
      regionCode: "",
      timezone: "",
      client
    },
    ipLookupUrl: "",
    createdAt: new Date().toISOString()
  };
  authEvents.unshift(record);
  console.log(JSON.stringify(record));
}

function createCommitBuckets() {
  return Array.from({ length: 24 }, (_, hour) => ({
    commits: [],
    count: 0,
    hour
  }));
}

function addCommitToBuckets(buckets, commit) {
  const date = new Date(commit.date);
  if (Number.isNaN(date.getTime())) return;
  const hour = date.getHours();
  buckets[hour].count += 1;
  buckets[hour].commits.push({
    date: date.toISOString(),
    description: String(commit.description || "").replace(/\s+/g, " ").trim().slice(0, 320),
    message: commit.message || "Commit",
    sha: commit.sha
  });
}

async function getCommitActivity() {
  const local = getLocalCommitActivity();
  if (local.totalCommits) return local;
  const loose = getLooseGitCommitActivity();
  if (loose.totalCommits) return loose;
  return await getGitHubCommitActivity();
}

function getLocalCommitActivity() {
  const buckets = createCommitBuckets();

  try {
    const output = childProcess.execFileSync("git", ["log", "--date=iso-strict", "--pretty=%H%x09%ad%x09%s%x09%b%x1e"], {
      cwd: path.resolve(root, ".."),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    output.split("\x1e").map((record) => record.trim()).filter(Boolean).forEach((record) => {
      const [sha, date, message = "Commit", description = ""] = record.split("\t");
      addCommitToBuckets(buckets, { date, description, message, sha });
    });
  } catch {
  }

  return {
    fallback: false,
    query: "local git log",
    status: "Local Git commit activity.",
    totalCommits: buckets.reduce((total, bucket) => total + bucket.count, 0),
    hourBuckets: buckets
  };
}

function getLooseGitCommitActivity() {
  const buckets = createCommitBuckets();
  const seen = new Set();
  const logs = [
    path.resolve(root, "..", ".git", "logs", "refs", "heads", "main"),
    path.resolve(root, "..", ".git", "logs", "HEAD")
  ];

  logs.forEach((logPath) => {
    try {
      fs.readFileSync(logPath, "utf8").split(/\r?\n/).filter(Boolean).forEach((line) => {
        const match = line.match(/^[0-9a-f]{40}\s+([0-9a-f]{40})\s+.+?\s+(\d+)\s+([+-]\d{4})\t/);
        if (!match || seen.has(match[1])) return;
        const commit = readLooseGitCommit(match[1], match[2], match[3]);
        if (!commit) return;
        seen.add(match[1]);
        addCommitToBuckets(buckets, commit);
      });
    } catch {
    }
  });

  return {
    fallback: true,
    query: "loose .git objects",
    status: "Local Git binary is unavailable; showing readable local commit objects.",
    totalCommits: buckets.reduce((total, bucket) => total + bucket.count, 0),
    hourBuckets: buckets
  };
}

function readLooseGitCommit(sha, fallbackSeconds, fallbackOffset) {
  try {
    const objectPath = path.resolve(root, "..", ".git", "objects", sha.slice(0, 2), sha.slice(2));
    const inflated = zlib.inflateSync(fs.readFileSync(objectPath));
    const nul = inflated.indexOf(0);
    const header = inflated.slice(0, nul).toString();
    if (!header.startsWith("commit ")) return null;
    const body = inflated.slice(nul + 1).toString();
    const [, authorSeconds = fallbackSeconds, authorOffset = fallbackOffset] = body.match(/\nauthor .+? (\d+) ([+-]\d{4})\n/) || [];
    const message = body.split("\n\n").slice(1).join("\n\n").trim();
    const [subject = "Commit", ...descriptionLines] = message.split(/\r?\n/);
    return {
      date: gitTimestampToIso(authorSeconds, authorOffset),
      description: descriptionLines.join(" ").trim(),
      message: subject,
      sha
    };
  } catch {
    return null;
  }
}

function gitTimestampToIso(seconds, offset) {
  const date = new Date(Number(seconds) * 1000);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

async function getGitHubCommitActivity() {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    commits: [],
    count: 0,
    hour
  }));
  const repository = String(process.env.GITHUB_REPOSITORY || "linjedev/linjedev").replace(/[^A-Za-z0-9_.\/-]/g, "");
  const headers = {
    "accept": "application/vnd.github+json",
    "user-agent": "linje-preview-commit-tracker"
  };
  const token = String(process.env.GITHUB_TOKEN || "").trim();
  if (token) headers.authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`https://api.github.com/repos/${repository}/commits?per_page=100`, { headers });
    if (!response.ok) throw new Error(`GitHub ${response.status}`);
    const commits = await response.json();
    (Array.isArray(commits) ? commits : []).forEach((item) => {
      const lines = String(item.commit?.message || "Commit").split(/\r?\n/);
      const message = lines.shift() || "Commit";
      const description = lines.join(" ").trim();
      addCommitToBuckets(buckets, {
        date: item.commit?.author?.date || item.commit?.committer?.date || "",
        description,
        message,
        sha: item.sha
      });
    });
    const totalCommits = await getGitHubCommitTotal(response.headers.get("link"), commits.length, headers);
    return {
      fallback: true,
      query: `repo:${repository}`,
      status: "Live from GitHub REST because local Git is unavailable.",
      totalCommits,
      hourBuckets: buckets
    };
  } catch {
    return {
      fallback: true,
      query: `repo:${repository}`,
      status: "Commit activity unavailable.",
      totalCommits: 0,
      hourBuckets: buckets
    };
  }
}

async function getGitHubCommitTotal(linkHeader, firstPageCount, headers) {
  const link = String(linkHeader || "");
  const match = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
  const urlMatch = link.match(/<([^>]+[?&]page=\d+[^>]*)>;\s*rel="last"/);
  if (match && urlMatch) {
    try {
      const lastPage = Number(match[1]);
      const response = await fetch(urlMatch[1], { headers });
      if (!response.ok) throw new Error("last page unavailable");
      const commits = await response.json();
      return ((lastPage - 1) * 100) + (Array.isArray(commits) ? commits.length : 0);
    } catch {
      return Math.max(firstPageCount, Number(match[1]) * 100);
    }
  }
  return firstPageCount;
}

function getPreviewArcadeScores() {
  return [...arcadeScores.values()]
    .sort((left, right) => right.score - left.score || left.updatedAt.localeCompare(right.updatedAt))
    .slice(0, 10)
    .map((entry, index) => ({
      rank: index + 1,
      username: entry.username,
      score: entry.score,
      updatedAt: entry.updatedAt
    }));
}

function normalizePreviewIp(value) {
  if (value === "::1" || value === "::ffff:127.0.0.1" || value === "127.0.0.1") {
    return "localhost";
  }
  return value;
}

function getCookie(request, name) {
  const header = request.headers.cookie || "";
  return header.split(";").map((item) => item.trim()).reduce((found, item) => {
    if (found) return found;
    const [key, ...rest] = item.split("=");
    return key === name ? decodeURIComponent(rest.join("=")) : "";
  }, "");
}

function readBody(request) {
  return new Promise((resolve) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function createCaptchaChallenge() {
  const left = randomInt(4, 19);
  const right = randomInt(2, 13);
  const question = `${left} + ${right}`;
  const payload = {
    answer: String(left + right),
    expiresAt: Date.now() + CAPTCHA_TTL_MS,
    question,
    nonce: crypto.randomBytes(12).toString("hex")
  };
  const body = base64UrlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  return {
    question,
    token: `${body}.${signCaptcha(body)}`,
    expiresAt: payload.expiresAt
  };
}

function verifyCaptcha(token, answer) {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) return false;
  const expected = signCaptcha(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return false;

  try {
    const payload = JSON.parse(Buffer.from(base64UrlToBase64(body), "base64").toString("utf8"));
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

function signCaptcha(body) {
  return base64UrlEncode(crypto.createHmac("sha256", CAPTCHA_SECRET).update(body).digest());
}

function randomInt(min, max) {
  return min + crypto.randomInt(max - min + 1);
}

function base64UrlEncode(buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBase64(value) {
  const base64 = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  return base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
}

function sendJson(response, status, body, headers = {}) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    ...headers
  });
  response.end(JSON.stringify(body));
}

function hexToText(hex) {
  let text = "";
  for (let index = 0; index < hex.length; index += 2) {
    text += String.fromCharCode(Number.parseInt(hex.slice(index, index + 2), 16));
  }
  return text;
}
