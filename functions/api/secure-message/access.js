import {
  getSessionUser,
  hasDatabase,
  isAdminUser,
  json,
  requireSameOrigin
} from "../../_auth.js";
import { ensureSecureMessageTables, getSecureMessageEnrollment } from "./_secure.js";

export async function onRequestGet({ request, env }) {
  if (!hasDatabase(env)) {
    return json({ error: "Secure message storage is not configured." }, { status: 503 });
  }

  const user = await getSessionUser({ request, env });
  if (!user) return json({ error: "Login required." }, { status: 401 });

  const admin = isAdminUser(user, env);
  const enrollment = await getSecureMessageEnrollment(env, user, admin);
  return json({
    admin,
    ...enrollment,
    username: user.username
  }, {
    headers: {
      "cache-control": "no-store"
    }
  });
}

export async function onRequestPost({ request, env }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  if (!hasDatabase(env)) {
    return json({ error: "Secure message storage is not configured." }, { status: 503 });
  }

  const user = await getSessionUser({ request, env });
  if (!user) return json({ error: "Login required." }, { status: 401 });

  const admin = isAdminUser(user, env);
  await ensureSecureMessageTables(env);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO secure_message_requests
     (user_id, username, status, requested_at, reviewed_by, reviewed_at)
     VALUES (?, ?, ?, ?, '', '')
     ON CONFLICT(user_id) DO UPDATE SET
       username = excluded.username,
       status = CASE
         WHEN secure_message_requests.status = 'approved' THEN 'approved'
         ELSE 'pending'
       END,
       requested_at = excluded.requested_at`
  ).bind(user.id, user.username, admin ? "approved" : "pending", now).run();

  if (admin) {
    await env.DB.prepare(
      `INSERT INTO secure_message_access
       (user_id, username, granted_by, granted_at, revoked_by, revoked_at)
       VALUES (?, ?, ?, ?, '', '')
       ON CONFLICT(user_id) DO UPDATE SET
         username = excluded.username,
         granted_by = excluded.granted_by,
         granted_at = excluded.granted_at,
         revoked_by = '',
         revoked_at = ''`
    ).bind(user.id, user.username, user.username, now).run();
  }

  const enrollment = await getSecureMessageEnrollment(env, user, admin);
  return json({ ...enrollment, username: user.username });
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}
