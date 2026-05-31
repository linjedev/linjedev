import { createCaptchaChallenge, json } from "../_auth.js";

export async function onRequestGet({ env }) {
  const challenge = await createCaptchaChallenge(env);
  return json(challenge, {
    headers: {
      "cache-control": "no-store"
    }
  });
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}
