const UPSTREAM_ORIGIN = "https://demo.worldwideview.dev";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://unpkg.com https://cdn.jsdelivr.net https://analytics.worldwideview.dev https://va.vercel-scripts.com https://pagead2.googlesyndication.com https://adservice.google.com https://www.googletagservices.com https://ep2.adtrafficquality.google https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: http: https:",
  "connect-src 'self' http: https: ws: wss:",
  "media-src 'self' blob: http: https:",
  "frame-src 'self' http: https: blob:",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
].join("; ");

function rewriteText(body) {
  return body
    .replaceAll("WorldWideView", "Linje.track")
    .replaceAll("WorldwideView", "Linje.track")
    .replaceAll("worldwideview.dev", "linje.dev")
    .replaceAll("demo.linje.dev", "linje.dev");
}

function rewriteLocation(location, requestUrl) {
  if (!location) return location;
  const upstream = new URL(UPSTREAM_ORIGIN);
  const current = new URL(requestUrl);
  return location
    .replaceAll(upstream.origin, current.origin)
    .replaceAll(upstream.hostname, current.hostname);
}

export default {
  async fetch(request) {
    const requestUrl = new URL(request.url);
    const upstreamUrl = new URL(requestUrl.pathname + requestUrl.search, UPSTREAM_ORIGIN);
    const headers = new Headers(request.headers);

    headers.set("X-Forwarded-Host", requestUrl.host);
    headers.set("X-Forwarded-Proto", requestUrl.protocol.replace(":", ""));
    headers.delete("cf-connecting-ip");
    headers.delete("cf-ipcountry");
    headers.delete("cf-ray");
    headers.delete("cf-visitor");

    const method = request.method.toUpperCase();
    const upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers,
      body: method === "GET" || method === "HEAD" ? undefined : request.body,
      redirect: "manual",
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set("Content-Security-Policy", CSP);
    responseHeaders.delete("X-Frame-Options");
    responseHeaders.delete("Content-Length");
    responseHeaders.set("X-Linje-Upstream", "demo.worldwideview.dev");

    const location = responseHeaders.get("Location");
    if (location) responseHeaders.set("Location", rewriteLocation(location, request.url));

    const contentType = responseHeaders.get("Content-Type") || "";
    if (contentType.includes("text/html")) {
      return new Response(rewriteText(await upstreamResponse.text()), {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
      });
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
