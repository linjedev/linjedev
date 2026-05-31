import { clearSessionCookie, deleteSession, hasDatabase, json } from "../_auth.js";

export async function onRequestPost({ request, env }) {
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
