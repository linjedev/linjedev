import {
  getSessionUser,
  hasDatabase,
  isAdminUser,
  json,
  normalizeUsername,
  readJson,
  requireSameOrigin
} from "../../_auth.js";
import { ensureSecureMessageTables } from "../secure-message/_secure.js";

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin({ request, env });
  if (admin.response) return admin.response;

  await ensureSecureMessageTables(env);
  const access = await env.DB.prepare(
    `SELECT COALESCE(secure_message_access.user_id, secure_message_requests.user_id) AS user_id,
            COALESCE(secure_message_access.username, secure_message_requests.username) AS username,
            secure_message_requests.status,
            secure_message_requests.requested_at,
            secure_message_access.granted_by, secure_message_access.granted_at,
            secure_message_access.revoked_by, secure_message_access.revoked_at,
            COUNT(secure_message_events.id) AS send_count,
            MAX(secure_message_events.created_at) AS last_sent_at
     FROM secure_message_requests
     LEFT JOIN secure_message_access ON secure_message_access.user_id = secure_message_requests.user_id
     LEFT JOIN secure_message_events ON secure_message_events.user_id = secure_message_requests.user_id
     GROUP BY secure_message_requests.user_id
     ORDER BY secure_message_requests.requested_at DESC`
  ).all();
  const events = await env.DB.prepare(
    `SELECT id, user_id, username, event, message_bytes, ciphertext_bytes,
            ip_address, user_agent, created_at
     FROM secure_message_events
     ORDER BY created_at DESC
     LIMIT 100`
  ).all();

  return json({
    grants: (access.results || []).map((grant) => ({
      userId: grant.user_id,
      username: grant.username,
      grantedBy: grant.granted_by || "",
      grantedAt: grant.granted_at || "",
      revokedBy: grant.revoked_by || "",
      revokedAt: grant.revoked_at || "",
      active: Boolean(grant.granted_at && !grant.revoked_at),
      requestedAt: grant.requested_at || "",
      sendCount: Number(grant.send_count) || 0,
      status: grant.revoked_at ? "revoked" : grant.granted_at ? "approved" : grant.status || "pending",
      lastSentAt: grant.last_sent_at || ""
    })),
    events: (events.results || []).map((event) => ({
      id: event.id,
      userId: event.user_id,
      username: event.username,
      event: event.event,
      messageBytes: Number(event.message_bytes) || 0,
      ciphertextBytes: Number(event.ciphertext_bytes) || 0,
      ipAddress: event.ip_address || "",
      userAgent: event.user_agent || "",
      createdAt: event.created_at
    }))
  }, {
    headers: {
      "cache-control": "no-store"
    }
  });
}

export async function onRequestPost({ request, env }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const admin = await requireAdmin({ request, env });
  if (admin.response) return admin.response;

  const input = await readJson(request);
  const username = normalizeUsername(input.username);
  if (!username) return json({ error: "Username required." }, { status: 400 });

  await ensureSecureMessageTables(env);
  const target = await env.DB.prepare(
    "SELECT id, username FROM users WHERE username = ?"
  ).bind(username).first();
  if (!target) return json({ error: "User not found." }, { status: 404 });

  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO secure_message_requests
     (user_id, username, status, requested_at, reviewed_by, reviewed_at)
     VALUES (?, ?, 'approved', ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       username = excluded.username,
       status = 'approved',
       reviewed_by = excluded.reviewed_by,
       reviewed_at = excluded.reviewed_at`
  ).bind(target.id, target.username, now, admin.user.username, now).run();
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
  ).bind(target.id, target.username, admin.user.username, now).run();

  return json({ granted: true, username: target.username, grantedAt: now });
}

export async function onRequestDelete({ request, env }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const admin = await requireAdmin({ request, env });
  if (admin.response) return admin.response;

  const input = await readJson(request);
  const username = normalizeUsername(input.username);
  if (!username) return json({ error: "Username required." }, { status: 400 });

  await ensureSecureMessageTables(env);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE secure_message_requests
     SET status = 'revoked', reviewed_by = ?, reviewed_at = ?
     WHERE username = ?`
  ).bind(admin.user.username, now, username).run();
  const result = await env.DB.prepare(
    `UPDATE secure_message_access
     SET revoked_by = ?, revoked_at = ?
     WHERE username = ? AND (revoked_at IS NULL OR revoked_at = '')`
  ).bind(admin.user.username, now, username).run();

  return json({ revoked: Boolean(result.success), username, revokedAt: now });
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}

async function requireAdmin({ request, env }) {
  if (!hasDatabase(env)) {
    return { response: json({ error: "D1 database binding DB is not configured." }, { status: 503 }) };
  }

  const user = await getSessionUser({ request, env });
  if (!user) {
    return { response: json({ error: "Login required." }, { status: 401 }) };
  }

  if (!isAdminUser(user, env)) {
    return { response: json({ error: "Admin access required." }, { status: 403 }) };
  }

  return { user };
}
