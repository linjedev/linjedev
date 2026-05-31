import { getSessionUser, hasDatabase, json, readJson, requireSameOrigin } from "../../_auth.js";

export async function onRequestGet({ env }) {
  if (!hasDatabase(env)) {
    return json({ error: "Leaderboard storage is not configured." }, { status: 503 });
  }

  await ensureArcadeScoresTable(env);
  return json({ scores: await getTopScores(env) });
}

export async function onRequestPost({ request, env }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  if (!hasDatabase(env)) {
    return json({ error: "Leaderboard storage is not configured." }, { status: 503 });
  }

  const user = await getSessionUser({ request, env });
  if (!user) return json({ error: "Login required." }, { status: 401 });

  const input = await readJson(request);
  const score = Math.max(0, Math.min(999999, Math.floor(Number(input.score) || 0)));
  if (!score) return json({ error: "Score must be greater than zero." }, { status: 400 });

  await ensureArcadeScoresTable(env);
  const now = new Date().toISOString();
  const current = await env.DB.prepare(
    "SELECT score, created_at FROM arcade_scores WHERE user_id = ?"
  ).bind(user.id).first();

  if (!current) {
    await env.DB.prepare(
      `INSERT INTO arcade_scores (user_id, username, score, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(user.id, user.username, score, now, now).run();
  } else if (score > Number(current.score || 0)) {
    await env.DB.prepare(
      `UPDATE arcade_scores
       SET username = ?, score = ?, updated_at = ?
       WHERE user_id = ?`
    ).bind(user.username, score, now, user.id).run();
  } else {
    await env.DB.prepare(
      "UPDATE arcade_scores SET username = ? WHERE user_id = ?"
    ).bind(user.username, user.id).run();
  }

  return json({ scores: await getTopScores(env) });
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}

async function ensureArcadeScoresTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS arcade_scores (
      user_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_arcade_scores_score ON arcade_scores(score DESC, updated_at ASC)"
  ).run();
}

async function getTopScores(env) {
  const result = await env.DB.prepare(
    `SELECT username, score, updated_at
     FROM arcade_scores
     ORDER BY score DESC, updated_at ASC
     LIMIT 10`
  ).all();

  return (result.results || []).map((entry, index) => ({
    rank: index + 1,
    username: entry.username,
    score: Number(entry.score) || 0,
    updatedAt: entry.updated_at
  }));
}
