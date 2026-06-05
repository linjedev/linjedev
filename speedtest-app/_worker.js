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

function page() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Linje</title><style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.08),transparent 24rem),linear-gradient(180deg,#050608 0%,#090a0d 52%,#030406 100%);color:#f5f5f7;font-family:Inter,Arial,sans-serif;padding:32px}.grid{position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:72px 72px;mask-image:radial-gradient(circle at center,#000 0%,transparent 74%);animation:drift 22s linear infinite}.wrap{position:relative;width:min(420px,calc(100vw - 48px));display:grid;place-items:center;gap:26px;text-align:center;filter:drop-shadow(0 32px 90px rgba(0,0,0,.5))}.mark-wrap{position:relative;width:min(300px,calc(100vw - 72px));aspect-ratio:1;display:grid;place-items:center}.orbit{position:absolute;border-radius:999px;border:1px dashed rgba(255,255,255,.22)}.outer{inset:0;animation:spin 18s linear infinite}.middle{inset:14%;border-color:rgba(94,160,255,.25);animation:spin 13s linear infinite reverse}.inner{inset:28%;border-color:rgba(168,137,255,.28);animation:spin 9s linear infinite}.mark{width:42%;height:42%;display:grid;place-items:center}.mark img{width:52%;height:52%;filter:drop-shadow(0 0 10px rgba(255,255,255,.28)) drop-shadow(0 0 24px rgba(255,255,255,.16))}.status{font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:rgba(245,245,247,.58)}@keyframes spin{to{transform:rotate(360deg)}}@keyframes drift{to{background-position:72px 72px}}</style></head><body><div class="grid"></div><main class="wrap" aria-label="Linje shelved"><div class="mark-wrap"><div class="orbit outer"></div><div class="orbit middle"></div><div class="orbit inner"></div><span class="mark"><img src="/logo/logo-icon.svg" alt=""></span></div><div class="status">shelved</div></main></body></html>`;
}

function headers(contentType) {
  return {
    "Content-Type": contentType,
    "Content-Security-Policy": CSP,
    "Cache-Control": "no-store",
    "X-Linje-Upstream": "shelved",
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/logo/logo-icon.svg") {
      return new Response(LOGO_SVG, {
        status: 200,
        headers: headers("image/svg+xml; charset=utf-8"),
      });
    }

    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ ok: false, status: "shelved" }), {
        status: 503,
        headers: headers("application/json; charset=utf-8"),
      });
    }

    if (request.method === "GET" || request.method === "HEAD") {
      return new Response(page(), {
        status: 200,
        headers: headers("text/html; charset=utf-8"),
      });
    }

    return new Response("Linje is shelved", {
      status: 503,
      headers: headers("text/plain; charset=utf-8"),
    });
  },
};
