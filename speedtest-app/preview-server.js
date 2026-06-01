const http = require("http");
const childProcess = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

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
}).listen(4173, () => {
  console.log("Linje Speed preview: http://localhost:4173/");
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
    const activity = getLocalCommitActivity();
    sendJson(response, 200, {
      query: "author:linjedev",
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
    sendJson(response, 200, getPreviewWorldNews());
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

function getPreviewWorldNews() {
  const updatedAt = new Date().toISOString();
  const articles = [
    {
      id: "ww-preview-london",
      title: "European capitals coordinate new infrastructure security exercises",
      url: "https://example.com/europe-security",
      domain: "example.com",
      language: "English",
      sourceCountry: "United Kingdom",
      region: "Europe",
      lat: 51.5,
      lon: -0.1,
      seenAt: updatedAt
    },
    {
      id: "ww-preview-tokyo",
      title: "Pacific markets watch chip supply signals after overnight policy update",
      url: "https://example.com/pacific-markets",
      domain: "example.com",
      language: "English",
      sourceCountry: "Japan",
      region: "East Asia",
      lat: 35.7,
      lon: 139.7,
      seenAt: updatedAt
    },
    {
      id: "ww-preview-brasilia",
      title: "South American climate summit tracks cross-border energy resilience",
      url: "https://example.com/climate-energy",
      domain: "example.com",
      language: "English",
      sourceCountry: "Brazil",
      region: "South America",
      lat: -15.8,
      lon: -47.9,
      seenAt: updatedAt
    },
    {
      id: "ww-preview-delhi",
      title: "Regional ports report higher freight checks across the Indian Ocean corridor",
      url: "https://example.com/freight-checks",
      domain: "example.com",
      language: "English",
      sourceCountry: "India",
      region: "South Asia",
      lat: 28.6,
      lon: 77.2,
      seenAt: updatedAt
    }
  ];
  return {
    articles,
    regions: [
      { region: "Europe", count: 1, latestAt: updatedAt },
      { region: "East Asia", count: 1, latestAt: updatedAt },
      { region: "South America", count: 1, latestAt: updatedAt },
      { region: "South Asia", count: 1, latestAt: updatedAt }
    ],
    source: "Preview feed",
    updatedAt
  };
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

function getLocalCommitActivity() {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    commits: [],
    count: 0,
    hour
  }));

  try {
    const output = childProcess.execFileSync("git", ["log", "--date=iso-strict", "--pretty=%H%x09%ad%x09%s"], {
      cwd: path.resolve(root, ".."),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    output.split(/\r?\n/).filter(Boolean).forEach((line) => {
      const [sha, dateValue, ...subjectParts] = line.split("\t");
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return;
      const hour = date.getHours();
      buckets[hour].count += 1;
      buckets[hour].commits.push({
        date: date.toISOString(),
        message: subjectParts.join("\t") || "Commit",
        sha
      });
    });
  } catch {
  }

  return {
    totalCommits: buckets.reduce((total, bucket) => total + bucket.count, 0),
    hourBuckets: buckets
  };
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
