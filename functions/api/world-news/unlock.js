import { json } from "../../_auth.js";

export function onRequest() {
  return json({ error: "World Watch now requires admin-approved registration." }, { status: 410 });
}
