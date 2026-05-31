import {
  getClientIp,
  getSessionUser,
  hasDatabase,
  isAdminUser,
  json,
  readJson,
  requireSameOrigin
} from "../../_auth.js";
import { ensureSecureMessageTables, hasSecureMessageAccess } from "./_secure.js";

export async function onRequestPost({ request, env }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  if (!hasDatabase(env)) {
    return json({ error: "Secure message storage is not configured." }, { status: 503 });
  }

  const user = await getSessionUser({ request, env });
  if (!user) return json({ error: "Login required." }, { status: 401 });

  const admin = isAdminUser(user, env);
  const allowed = await hasSecureMessageAccess(env, user, admin);
  if (!allowed) {
    return json({ error: "Secure Message access required." }, { status: 403 });
  }

  const input = await readJson(request);
  const messageBytes = Math.max(0, Math.min(20000, Math.floor(Number(input.messageBytes) || 0)));
  const ciphertextBytes = Math.max(0, Math.min(50000, Math.floor(Number(input.ciphertextBytes) || 0)));
  const now = new Date().toISOString();

  await ensureSecureMessageTables(env);
  await env.DB.prepare(
    `INSERT INTO secure_message_events
     (id, user_id, username, event, message_bytes, ciphertext_bytes, ip_address, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    crypto.randomUUID(),
    user.id,
    user.username,
    "send",
    messageBytes,
    ciphertextBytes,
    getClientIp(request),
    request.headers.get("user-agent") || "",
    now
  ).run();

  return json({ logged: true, createdAt: now });
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}
