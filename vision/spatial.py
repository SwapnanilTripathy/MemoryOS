import json
from pathlib import Path

SPATIAL_FILE = (
    Path(__file__).resolve().parent.parent
    / "database"
    / "spatial_memory.json"
)


def _load_memory():
    if not SPATIAL_FILE.exists():
        return []

    try:
        return json.loads(SPATIAL_FILE.read_text())
    except (OSError, json.JSONDecodeError):
        return []


def _save_memory(memory):
    SPATIAL_FILE.parent.mkdir(parents=True, exist_ok=True)
    SPATIAL_FILE.write_text(json.dumps(memory, indent=2))


def record_positions(image, detections):
    """Store normalized center positions for detected objects."""
    memory = _load_memory()
    width, height = image.size

    if width <= 0 or height <= 0:
        return detections

    for detection in detections:
        box = detection.get("box")

        if not box or len(box) != 4:
            continue

        x1, y1, x2, y2 = box
        center_x = (x1 + x2) / 2
        center_y = (y1 + y2) / 2

        position = {
            "x": round(center_x / width, 4),
            "y": round(center_y / height, 4),
        }

        detection["position"] = position

        if detection.get("object_id"):
            memory.append({
                "object_id": detection["object_id"],
                "label": detection.get("label"),
                "position": position,
            })

    _save_memory(memory)
    return detections
