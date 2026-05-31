import {
  getSessionUser,
  hashPassword,
  hasDatabase,
  json,
  readJson,
  timingSafeEqual
} from "../../_auth.js";

export async function onRequestPost({ request, env }) {
  if (!hasDatabase(env)) {
    return json({ error: "Account storage is not configured." }, { status: 503 });
  }

  const sessionUser = await getSessionUser({ request, env });
  if (!sessionUser) return json({ error: "Login required." }, { status: 401 });

  const input = await readJson(request);
  const currentPassword = String(input.currentPassword || "");
  const newPassword = String(input.newPassword || "");

  if (newPassword.length < 8) {
    return json({ error: "Passwords need at least 8 characters." }, { status: 400 });
  }

  const user = await env.DB.prepare(
    `SELECT id, password_hash, password_salt
     FROM users
     WHERE id = ?`
  ).bind(sessionUser.id).first();

  if (!user) return json({ error: "Login required." }, { status: 401 });

  const candidate = await hashPassword(currentPassword, user.password_salt);
  if (!timingSafeEqual(candidate.hash, user.password_hash)) {
    return json({ error: "Current password is wrong." }, { status: 401 });
  }

  const next = await hashPassword(newPassword);
  await env.DB.prepare(
    `UPDATE users
     SET password_hash = ?, password_salt = ?, password_iterations = ?
     WHERE id = ?`
  ).bind(next.hash, next.salt, next.iterations, user.id).run();

  return json({ updated: true });
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}
