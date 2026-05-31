import { clearSessionCookie, deleteSession, hasDatabase, json, requireSameOrigin } from "../_auth.js";

export async function onRequestPost({ request, env }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  if (hasDatabase(env)) {
    await deleteSession({ request, env });
  }

  return json(
    { authenticated: false },
    { headers: { "set-cookie": clearSessionCookie(request) } }
  );
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}
