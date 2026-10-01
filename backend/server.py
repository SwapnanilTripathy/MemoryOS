import base64
import io
import json
from http.server import BaseHTTPRequestHandler, HTTPServer

from PIL import Image

from vision.detector import detect_objects

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
            self._send_json(404, {
                "ok": False,
                "error": "Endpoint not found",
            })
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(
                self.rfile.read(length).decode("utf-8")
            )

            image_data = payload.get("image")

            if not image_data:
                self._send_json(400, {
                    "ok": False,
                    "error": "Image is required",
                })
                return

            encoded_image = image_data.split(",", 1)[-1]
            image_bytes = base64.b64decode(encoded_image)
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

            detections = detect_objects(image)

            self._send_json(200, {
                "ok": True,
                "message": "Memory frame received and analyzed.",
                "imageReceived": True,
                "detections": detections,
            })

        except (ValueError, json.JSONDecodeError, base64.binascii.Error):
            self._send_json(400, {
                "ok": False,
                "error": "Invalid image request",
            })

        except Exception as exc:
            print(f"Object detection error: {exc}")
            self._send_json(500, {
                "ok": False,
                "error": "Object detection failed",
            })


if __name__ == "__main__":
    print(f"MEMORYOS backend running on http://localhost:{PORT}")
    HTTPServer((HOST, PORT), Handler).serve_forever()
