import { getClientIp, json } from "../_auth.js";

export function onRequestGet({ request }) {
  return json({
    ipAddress: getClientIp(request) || "unavailable",
    userAgent: request.headers.get("user-agent") || "unavailable"
  }, {
    headers: {
      "cache-control": "no-store"
    }
  });
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}
