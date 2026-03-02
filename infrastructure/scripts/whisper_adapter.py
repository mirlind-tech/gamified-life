#!/usr/bin/env python3
"""
Whisper-compatible local adapter.

Accepts:
POST /transcribe
{
  "audio_base64": "...",
  "language": "en",
  "prompt": "..."
}

Returns:
{
  "text": "...",
  "language": "en"
}
"""

from __future__ import annotations

import base64
import json
from http.server import BaseHTTPRequestHandler, HTTPServer


HOST = "0.0.0.0"
PORT = 9000


class WhisperAdapterHandler(BaseHTTPRequestHandler):
    def log_message(self, *_args) -> None:
        return

    def _send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == "/health":
            self._send_json({"status": "ok", "service": "whisper-adapter"})
            return
        self._send_json({"error": "not found"}, status=404)

    def do_POST(self) -> None:
        if self.path != "/transcribe":
            self._send_json({"error": "not found"}, status=404)
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)
        try:
            body = json.loads(raw_body.decode("utf-8"))
        except Exception:
            self._send_json({"error": "invalid json"}, status=400)
            return

        audio_base64 = body.get("audio_base64")
        if not isinstance(audio_base64, str) or not audio_base64.strip():
            self._send_json({"error": "audio_base64 is required"}, status=400)
            return

        try:
            audio_bytes = base64.b64decode(audio_base64, validate=True)
        except Exception:
            self._send_json({"error": "invalid audio_base64 payload"}, status=400)
            return

        language = body.get("language")
        language = language if isinstance(language, str) and language.strip() else "en"

        # Placeholder transcript text keeps voice pipeline testable in local env.
        transcript = f"Whisper adapter received {len(audio_bytes)} audio bytes."
        self._send_json({"text": transcript, "language": language})


def main() -> None:
    server = HTTPServer((HOST, PORT), WhisperAdapterHandler)
    print(f"Whisper adapter listening on http://{HOST}:{PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
