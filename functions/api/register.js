import {
  createSession,
  hashPassword,
  hasDatabase,
  json,
  logAuthEvent,
  normalizeUsername,
  publicUser,
  readJson,
  validateAccount
} from "../_auth.js";

export async function onRequestPost({ request, env }) {
  if (!hasDatabase(env)) {
    return json({ error: "D1 database binding DB is not configured." }, { status: 503 });
  }

  const input = await readJson(request);
  const username = normalizeUsername(input.username);
  const password = String(input.password || "");
  const validationError = validateAccount({ username, password });

  if (validationError) {
    await logAuthEvent({ request, env, username, event: "register", success: false, client: input.client, failureReason: validationError });
    return json({ error: validationError }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const passwordData = await hashPassword(password);

  try {
    await env.DB.prepare(
      `INSERT INTO users
       (id, username, password_hash, password_salt, password_iterations, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      username,
      passwordData.hash,
      passwordData.salt,
      passwordData.iterations,
      now
    ).run();
  } catch (error) {
    await logAuthEvent({ request, env, username, event: "register", success: false, client: input.client, failureReason: "username_taken" });
    return json({ error: "That username is already taken." }, { status: 409 });
  }

  const user = publicUser({ id, username, created_at: now });
  const cookie = await createSession({ request, env, userId: id });
  await logAuthEvent({ request, env, userId: id, username, event: "register", success: true, client: input.client });
  return json({ authenticated: true, user }, { status: 201, headers: { "set-cookie": cookie } });
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}
