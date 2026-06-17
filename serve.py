#!/usr/bin/env python3
"""No-cache static dev server for the leaderboard site.

Drop-in replacement for `python -m http.server` for LOCAL DEVELOPMENT. The stock
http.server sends no Cache-Control header, so browsers heuristically cache the
un-versioned shared assets (shared/nav.js, data-loader.js, viz-common.js, the CSS,
…) and silently keep running OLD code after you edit them — even across reloads.
That is what made earlier UI fixes appear "not to work" until a manual hard-refresh.

This server stamps `Cache-Control: no-store` on every response, so the browser
always re-fetches. No per-file `?v=` versioning to maintain.

Production (GitHub Pages) is unaffected: it serves with its own sensible cache
headers, so this is purely a dev-time convenience.

Usage (run from this `websites/` directory — it is the site root):
    python serve.py            # http://localhost:5070
    python serve.py 8080       # custom port
"""
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5070
    httpd = HTTPServer(("", port), NoCacheHandler)
    print(f"No-cache dev server: http://localhost:{port}  (serving {sys.argv[0].rsplit('/', 1)[0] or '.'}; Ctrl+C to stop)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
