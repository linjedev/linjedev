const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const users = new Map();
const sessions = new Map();
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

  if (pathname === "/api/register" && request.method === "POST") {
    const body = await readBody(request);
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");

    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      logPreviewAuthEvent(request, { event: "register", username, success: false, client: body.client, failureReason: "invalid_username" });
      sendJson(response, 400, { error: "Usernames need 3-24 letters, numbers, or underscores." });
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

function logPreviewAuthEvent(request, { event, userId = "", username = "", success, client = {}, failureReason = "" }) {
  console.log(JSON.stringify({
    event,
    userId,
    username,
    success,
    failureReason,
    ipAddress: request.socket.remoteAddress || "",
    userAgent: request.headers["user-agent"] || "",
    acceptLanguage: request.headers["accept-language"] || "",
    client,
    createdAt: new Date().toISOString()
  }));
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
