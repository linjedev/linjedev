import { isAdminUser, json, requireSameOrigin } from "../../_auth.js";
import {
  getWorldNewsEnrollment,
  requestWorldNewsAccess,
  requireWorldNewsUser
} from "./_world-news.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireWorldNewsUser({ request, env });
  if (auth.response) return auth.response;

  const admin = isAdminUser(auth.user, env);
  const enrollment = await getWorldNewsEnrollment({ env, user: auth.user, admin });
  return json(enrollment, {
    headers: {
      "cache-control": "no-store"
    }
  });
}

export async function onRequestPost({ request, env }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireWorldNewsUser({ request, env });
  if (auth.response) return auth.response;

  const enrollment = await requestWorldNewsAccess({ env, user: auth.user });
  return json(enrollment, {
    headers: {
      "cache-control": "no-store"
    }
  });
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}
