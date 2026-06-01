import { json } from "../../_auth.js";

export function onRequestGet({ env }) {
  return json({
    cesiumIonToken: String(env?.CESIUM_ION_TOKEN || ""),
    cesiumBaseUrl: "/cesium/"
  }, {
    headers: {
      "cache-control": "no-store"
    }
  });
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}
