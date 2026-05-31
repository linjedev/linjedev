import { createCaptchaChallenge, json } from "../_auth.js";

export async function onRequestGet({ env }) {
  try {
    const challenge = await createCaptchaChallenge(env);
    return json(challenge, {
      headers: {
        "cache-control": "no-store"
      }
    });
  } catch {
    return json({ error: "Captcha is not configured." }, { status: 503 });
  }
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}
