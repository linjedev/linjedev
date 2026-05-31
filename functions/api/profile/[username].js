import { hasDatabase, json, normalizeUsername } from "../../_auth.js";

export async function onRequestGet({ env, params }) {
  if (!hasDatabase(env)) {
    return json({ error: "Profile storage is not configured." }, { status: 503 });
  }

  const username = normalizeUsername(params.username);
  await ensureProfilesTable(env);

  const profile = await env.DB.prepare(
    `SELECT users.username, profiles.avatar_url, profiles.about, profiles.updated_at
     FROM users
     LEFT JOIN profiles ON profiles.user_id = users.id
     WHERE users.username = ?`
  ).bind(username).first();

  if (!profile) {
    return json({ error: "Profile not found." }, { status: 404 });
  }

  return json({
    profile: {
      username: profile.username,
      avatarUrl: profile.avatar_url || "",
      about: profile.about || "",
      updatedAt: profile.updated_at || ""
    }
  });
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}

async function ensureProfilesTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      avatar_url TEXT DEFAULT '',
      about TEXT DEFAULT '',
      updated_at TEXT NOT NULL
    )`
  ).run();
}
