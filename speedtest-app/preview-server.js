const http = require("http");
const childProcess = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const users = new Map();
const sessions = new Map();
const authEvents = [];
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

  if (pathname === "/api/github/commits" && request.method === "GET") {
    sendJson(response, 200, {
      query: "author:linjedev",
      totalCommits: getLocalCommitCount(),
      cachedFor: 60
    }, {
      "cache-control": "public, max-age=60"
    });
    return;
  }

  if (pathname === "/api/admin/events" && request.method === "GET") {
    const user = currentUser(request);
    if (!user) {
      sendJson(response, 401, { error: "Login required." });
      return;
    }
    if (user.username !== "seb") {
      sendJson(response, 403, { error: "Admin access required." });
      return;
    }
    sendJson(response, 200, { events: authEvents.slice(0, 200) });
    return;
  }

  if (pathname === "/api/register" && request.method === "POST") {
    const body = await readBody(request);
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");

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
      password,
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
    const user = [...users.values()].find((item) => item.username === username && item.password === password);

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

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt
  };
}

function normalizeUsername(username) {
  return String(username || "").trim().replace(/^@+/, "").toLowerCase();
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

function getLocalCommitCount() {
  try {
    return Number(childProcess.execFileSync("git", ["rev-list", "--count", "HEAD"], {
      cwd: path.resolve(root, ".."),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim()) || 0;
  } catch {
    return 0;
  }
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
