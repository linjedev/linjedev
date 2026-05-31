import { getSessionUser, hasDatabase, json } from "../../_auth.js";

export async function onRequestGet({ request, env }) {
  if (!hasDatabase(env)) {
    return json({ error: "D1 database binding DB is not configured." }, { status: 503 });
  }

  const user = await getSessionUser({ request, env });
  if (!user) {
    return json({ error: "Login required." }, { status: 401 });
  }

  if (user.username !== "seb") {
    return json({ error: "Admin access required." }, { status: 403 });
  }

  const result = await env.DB.prepare(
    `SELECT id, user_id, username, event, success, ip_address, user_agent,
            country, colo, asn, metadata, failure_reason, created_at
     FROM auth_events
     ORDER BY created_at DESC
     LIMIT 200`
  ).all();

  return json({
    events: (result.results || []).map((event) => ({
      id: event.id,
      userId: event.user_id || "",
      username: event.username || "",
      event: event.event,
      success: Boolean(event.success),
      ipAddress: event.ip_address || "",
      userAgent: event.user_agent || "",
      country: event.country || "",
      colo: event.colo || "",
      asn: event.asn || "",
      metadata: parseMetadata(event.metadata),
      failureReason: event.failure_reason || "",
      ipLookupUrl: event.ip_address ? `https://ipinfo.io/${encodeURIComponent(event.ip_address)}` : "",
      createdAt: event.created_at
    }))
  });
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}

function parseMetadata(value) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}
