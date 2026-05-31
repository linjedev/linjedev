import { getSessionUser, hasDatabase, json } from "../_auth.js";

export async function onRequestGet({ request, env }) {
  if (!hasDatabase(env)) {
    return json({ authenticated: false });
  }

  const user = await getSessionUser({ request, env });
  return json({
    authenticated: Boolean(user),
    user
  });
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}
