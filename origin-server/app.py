"""Origin web server for the Cloudflare Application Services assignment.

This server exposes a single endpoint that returns every HTTP request header
it received in the body of the HTTP response. It is intended to run behind
Cloudflare (proxied), reached either directly over Full-Strict TLS or through
a Cloudflare Tunnel.

Run locally:
    python app.py

Environment variables:
    HOST  Interface to bind to (default: 0.0.0.0)
    PORT  Port to listen on (default: 8080)
"""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Dict


def collect_headers(headers: object) -> Dict[str, str]:
    """Return the request headers as an ordered plain dictionary.

    Args:
        headers: The ``http.client.HTTPMessage`` instance from the request.

    Returns:
        A dictionary mapping each header name to its value, preserving the
        order in which the headers were received.
    """
    return {key: value for key, value in headers.items()}


def render_body(headers: Dict[str, str], client_ip: str) -> bytes:
    """Build the JSON response body describing the received request headers.

    Args:
        headers: The request headers collected from the client.
        client_ip: The remote address that opened the TCP connection.

    Returns:
        The UTF-8 encoded JSON payload to send back to the client.
    """
    payload = {
        "message": "All HTTP request headers received by the origin server",
        "client_ip": client_ip,
        "header_count": len(headers),
        "headers": headers,
    }
    return json.dumps(payload, indent=2).encode("utf-8")


class HeaderEchoHandler(BaseHTTPRequestHandler):
    """HTTP request handler that echoes request headers back to the caller."""

    server_version = "HeaderEcho/1.0"

    def _respond(self) -> None:
        """Write the standard header-echo response for the current request."""
        headers = collect_headers(self.headers)
        body = render_body(headers, self.client_address[0])
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        """Handle GET requests by echoing the request headers."""
        self._respond()

    def do_POST(self) -> None:
        """Handle POST requests by echoing the request headers."""
        self._respond()

    def log_message(self, format: str, *args: object) -> None:
        """Log a concise access line for each request.

        Args:
            format: The printf-style format string supplied by the base class.
            *args: The values interpolated into ``format``.
        """
        print(f"{self.client_address[0]} - {format % args}")


def main() -> None:
    """Start the threaded HTTP server and serve requests until interrupted."""
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer((host, port), HeaderEchoHandler)
    print(f"Header-echo origin server listening on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down origin server")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
