from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST = "127.0.0.1"
PORT = 8000

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Safer local defaults and fewer caching surprises while editing.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    print(f"Serving {root}")
    print(f"Open http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
