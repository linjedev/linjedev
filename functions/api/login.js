import {
  createSession,
  hashPassword,
  hasDatabase,
  json,
  logAuthEvent,
  normalizeUsername,
  publicUser,
  readJson,
  timingSafeEqual
} from "../_auth.js";

export async function onRequestPost({ request, env }) {
  if (!hasDatabase(env)) {
    return json({ error: "D1 database binding DB is not configured." }, { status: 503 });
  }

  const input = await readJson(request);
  const username = normalizeUsername(input.username);
  const password = String(input.password || "");

  const user = await env.DB.prepare(
    `SELECT id, username, password_hash, password_salt, created_at
     FROM users
     WHERE username = ?`
  ).bind(username).first();

  if (!user) {
    await logAuthEvent({ request, env, username, event: "login", success: false, client: input.client, failureReason: "unknown_username" });
    return json({ error: "Username or password is wrong." }, { status: 401 });
  }

  const candidate = await hashPassword(password, user.password_salt);
  if (!timingSafeEqual(candidate.hash, user.password_hash)) {
    await logAuthEvent({ request, env, userId: user.id, username, event: "login", success: false, client: input.client, failureReason: "bad_password" });
    return json({ error: "Username or password is wrong." }, { status: 401 });
  }

  const cookie = await createSession({ request, env, userId: user.id });
  await logAuthEvent({ request, env, userId: user.id, username, event: "login", success: true, client: input.client });
  return json({ authenticated: true, user: publicUser(user) }, { headers: { "set-cookie": cookie } });
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}
