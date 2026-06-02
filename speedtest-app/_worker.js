const LOGO_SVG = `<svg width="86" height="85" viewBox="0 0 86 85" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.97156 77.5549L78.6823 6.84416C40.9784 46.8334 26.0874 61.7579 37.4667 76.1661C25.2931 68.0038 20.0318 69.4808 7.97156 77.5549Z" fill="#EAEAEA"/>
<path d="M78.6822 6.84407L7.97156 77.5548C45.6754 37.5656 60.5664 22.641 49.1871 8.23281C61.3607 16.3951 66.622 14.9182 78.6822 6.84407Z" fill="#EAEAEA"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M50.1323 11.5483C38.4059 8.73493 25.5678 12.6745 17.5153 22.7152C10.0066 32.078 8.57993 44.3506 12.7129 54.7508C21.7798 55.5894 32.9597 50.1119 41.1528 39.8959C48.5438 30.68 51.6428 19.9287 50.1323 11.5483ZM37.5649 74.5831C48.569 76.2972 60.1659 72.2339 67.6401 62.9143C75.6526 52.9234 76.7396 39.6191 71.5358 28.8122C63.0544 29.2016 53.2886 34.5544 45.9313 43.7282C37.7798 53.8924 34.849 65.9241 37.5649 74.5831Z" fill="#EAEAEA"/>
</svg>`;

const CSP = [
  "default-src 'none'",
  "img-src 'self' data:",
  "style-src 'unsafe-inline'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

function splashHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Linje</title><style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.08),transparent 24rem),linear-gradient(180deg,#050608 0%,#090a0d 52%,#030406 100%);color:#f5f5f7;font-family:Inter,Arial,sans-serif;padding:32px}.grid{position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:72px 72px;mask-image:radial-gradient(circle at center,#000 0%,transparent 74%);animation:drift 22s linear infinite}.panel{position:relative;width:min(560px,100%);display:grid;justify-items:center;gap:18px;padding:54px 38px;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:rgba(10,11,14,.52);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 32px 90px rgba(0,0,0,.45);backdrop-filter:blur(26px) saturate(140%);-webkit-backdrop-filter:blur(26px) saturate(140%)}.mark-wrap{position:relative;width:128px;height:128px;display:grid;place-items:center;margin-bottom:4px}.orbit{position:absolute;border-radius:999px;border:1px dashed rgba(255,255,255,.22)}.outer{inset:0;animation:spin 18s linear infinite}.middle{inset:18px;border-color:rgba(94,160,255,.25);animation:spin 13s linear infinite reverse}.inner{inset:36px;border-color:rgba(168,137,255,.28);animation:spin 9s linear infinite}.mark{width:54px;height:54px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.22);border-radius:8px;background:rgba(255,255,255,.12);box-shadow:0 0 42px rgba(255,255,255,.18)}.mark img{width:28px;height:28px}.eyebrow{margin:0;color:rgba(255,255,255,.62);font-size:13px;font-weight:700;letter-spacing:0;text-transform:uppercase}.title{margin:0;max-width:12ch;text-align:center;font-size:clamp(40px,7vw,74px);line-height:.94;font-weight:850;letter-spacing:0}.copy{margin:0;max-width:34rem;color:rgba(255,255,255,.68);text-align:center;font-size:17px;line-height:1.55}@keyframes spin{to{transform:rotate(360deg)}}@keyframes drift{to{background-position:72px 72px}}@media(max-width:560px){body{padding:18px}.panel{padding:42px 22px;border-radius:8px}.title{font-size:44px}}</style></head><body><div class="grid"></div><main class="panel"><div class="mark-wrap" aria-hidden="true"><div class="orbit outer"></div><div class="orbit middle"></div><div class="orbit inner"></div><span class="mark"><img src="/logo/logo-icon.svg" alt=""></span></div><p class="eyebrow">Linje</p><h1 class="title">New signal coming soon.</h1><p class="copy">Linje is offline while the next public experience is prepared.</p></main></body></html>`;
}

function splashResponse() {
  return new Response(splashHtml(), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": CSP,
      "Cache-Control": "no-store",
      "X-Linje-Upstream": "splash",
    },
  });
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Security-Policy": CSP,
      "Cache-Control": "no-store",
      "X-Linje-Upstream": "splash",
    },
  });
}

export default {
  async fetch(request) {
    const requestUrl = new URL(request.url);

    if (requestUrl.pathname === "/logo/logo-icon.svg") {
      return new Response(LOGO_SVG, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Content-Security-Policy": CSP,
          "Cache-Control": "public, max-age=3600",
          "X-Linje-Upstream": "logo",
        },
      });
    }

    if (requestUrl.pathname === "/api/health") {
      return jsonResponse({ ok: true }, 200);
    }

    if (requestUrl.pathname.startsWith("/api")) {
      return jsonResponse({ error: "Linje is offline" }, 404);
    }

    if (request.method.toUpperCase() === "GET" || request.method.toUpperCase() === "HEAD") {
      return splashResponse();
    }

    return new Response("Linje is offline", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Security-Policy": CSP,
        "Cache-Control": "no-store",
        "X-Linje-Upstream": "splash",
      },
    });
  },
};
