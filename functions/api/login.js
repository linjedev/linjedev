import {
  createSession,
  hashPassword,
  hasDatabase,
  isAdminUser,
  json,
  logAuthEvent,
  normalizeUsername,
  publicUser,
  readJson,
  requireSameOrigin,
  shouldUpgradePasswordHash,
  verifyPassword,
  verifyCaptcha
} from "../_auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const originError = requireSameOrigin(request);
    if (originError) return originError;

    if (!hasDatabase(env)) {
      return json({ error: "D1 database binding DB is not configured." }, { status: 503 });
    }

    const input = await readJson(request);
    const username = normalizeUsername(input.username);
    const password = String(input.password || "");
    const captchaOk = await verifyCaptcha({ token: input.captchaToken, answer: input.captchaAnswer, env });
    if (!captchaOk) {
      await logAuthEvent({ request, env, username, event: "login", success: false, client: input.client, failureReason: "captcha_failed" });
      return json({ error: "Linje check answer is wrong or expired." }, { status: 400 });
    }

    const user = await env.DB.prepare(
      `SELECT id, username, password_hash, password_salt, password_iterations, created_at
       FROM users
       WHERE username = ?`
    ).bind(username).first();

    if (!user) {
      await logAuthEvent({ request, env, username, event: "login", success: false, client: input.client, failureReason: "unknown_username" });
      return json({ error: "Username or password is wrong." }, { status: 401 });
    }

    if (!await verifyPassword(password, user)) {
      await logAuthEvent({ request, env, userId: user.id, username, event: "login", success: false, client: input.client, failureReason: "bad_password" });
      return json({ error: "Username or password is wrong." }, { status: 401 });
    }

    if (shouldUpgradePasswordHash(user)) {
      const next = await hashPassword(password);
      await env.DB.prepare(
        `UPDATE users
         SET password_hash = ?, password_salt = ?, password_iterations = ?
         WHERE id = ?`
      ).bind(next.hash, next.salt, next.iterations, user.id).run();
    }

    const cookie = await createSession({ request, env, userId: user.id });
    await logAuthEvent({ request, env, userId: user.id, username, event: "login", success: true, client: input.client });
    const sessionUser = publicUser(user);
    return json({
      authenticated: true,
      user: { ...sessionUser, admin: isAdminUser(sessionUser, env) }
    }, { headers: { "set-cookie": cookie } });
  } catch (error) {
    return json({ error: "Account service failed during login." }, { status: 500 });
  }
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}
