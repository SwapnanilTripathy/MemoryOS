from http.server import BaseHTTPRequestHandler, HTTPServer
import json

HOST = "0.0.0.0"
PORT = 8000

class Handler(BaseHTTPRequestHandler):
    def _send_json(self, status, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send_json(200, {"ok": True})

    def do_POST(self):
        if self.path != "/api/memory-frame":
            self._send_json(404, {"ok": False, "error": "Endpoint not found"})
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            image = payload.get("image")

            if not image:
                self._send_json(400, {"ok": False, "error": "Image is required"})
                return

            self._send_json(200, {
                "ok": True,
                "message": "Memory frame received.",
                "imageReceived": True,
            })
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"ok": False, "error": "Invalid request"})

if __name__ == "__main__":
    print(f"MEMORYOS backend running on http://localhost:{PORT}")
    HTTPServer((HOST, PORT), Handler).serve_forever()
