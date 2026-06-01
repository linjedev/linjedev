import {
  getSessionUser,
  hasDatabase,
  isAdminUser,
  json,
  normalizeUsername,
  readJson,
  requireSameOrigin
} from "../../_auth.js";
import { ensureWorldNewsTables } from "../world-news/_world-news.js";

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin({ request, env });
  if (admin.response) return admin.response;

  await ensureWorldNewsTables(env);
  const access = await env.DB.prepare(
    `SELECT COALESCE(world_news_access.user_id, world_news_requests.user_id) AS user_id,
            COALESCE(world_news_access.username, world_news_requests.username) AS username,
            world_news_requests.status,
            world_news_requests.requested_at,
            world_news_requests.reviewed_by,
            world_news_requests.reviewed_at,
            world_news_access.granted_by,
            world_news_access.granted_at,
            world_news_access.revoked_by,
            world_news_access.revoked_at
     FROM world_news_requests
     LEFT JOIN world_news_access ON world_news_access.user_id = world_news_requests.user_id
     ORDER BY world_news_requests.requested_at DESC`
  ).all();

  return json({
    grants: (access.results || []).map((grant) => {
      const active = Boolean(grant.granted_at && !grant.revoked_at);
      return {
        userId: grant.user_id,
        username: grant.username,
        requestedAt: grant.requested_at || "",
        reviewedBy: grant.reviewed_by || "",
        reviewedAt: grant.reviewed_at || "",
        grantedBy: grant.granted_by || "",
        grantedAt: grant.granted_at || "",
        revokedBy: grant.revoked_by || "",
        revokedAt: grant.revoked_at || "",
        active,
        status: active ? "approved" : grant.revoked_at ? "denied" : grant.status || "pending"
      };
    })
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

  await ensureWorldNewsTables(env);
  const target = await env.DB.prepare(
    "SELECT id, username FROM users WHERE username = ?"
  ).bind(username).first();
  if (!target) return json({ error: "User not found." }, { status: 404 });

  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO world_news_requests
     (user_id, username, status, requested_at, reviewed_by, reviewed_at)
     VALUES (?, ?, 'approved', ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       username = excluded.username,
       status = 'approved',
       reviewed_by = excluded.reviewed_by,
       reviewed_at = excluded.reviewed_at`
  ).bind(target.id, target.username, now, admin.user.username, now).run();
  await env.DB.prepare(
    `INSERT INTO world_news_access
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

  await ensureWorldNewsTables(env);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE world_news_requests
     SET status = 'denied', reviewed_by = ?, reviewed_at = ?
     WHERE username = ?`
  ).bind(admin.user.username, now, username).run();
  await env.DB.prepare(
    `UPDATE world_news_access
     SET revoked_by = ?, revoked_at = ?
     WHERE username = ? AND (revoked_at IS NULL OR revoked_at = '')`
  ).bind(admin.user.username, now, username).run();

  return json({ denied: true, username, deniedAt: now });
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
