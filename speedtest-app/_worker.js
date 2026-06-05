const ORIGIN = "https://com-liver-neo-participate.trycloudflare.com";

function copyRequestHeaders(headers) {
  const next = new Headers(headers);
  next.set("X-Forwarded-Host", "linje.dev");
  next.set("X-Forwarded-Proto", "https");
  next.set("X-Linje-Proxy", "cloudflare-pages");
  next.delete("Host");
  return next;
}

export default {
  async fetch(request) {
    const incomingUrl = new URL(request.url);
    const originUrl = new URL(incomingUrl.pathname + incomingUrl.search, ORIGIN);

    const proxied = new Request(originUrl, {
      method: request.method,
      headers: copyRequestHeaders(request.headers),
      body: request.body,
      redirect: "manual",
    });

    const response = await fetch(proxied);
    const headers = new Headers(response.headers);
    headers.set("X-Linje-Upstream", "cs2-app");
    headers.delete("Content-Security-Policy");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
