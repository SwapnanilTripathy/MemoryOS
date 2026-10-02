import json
from pathlib import Path

SPATIAL_FILE = (
    Path(__file__).resolve().parent.parent
    / "database"
    / "spatial_memory.json"
)

MOVEMENT_THRESHOLD = 0.12


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


def _get_zone(x, y):
    """Convert normalized x/y coordinates into a human-readable 3x3 zone."""
    if y < 1 / 3:
        row = "top"
    elif y < 2 / 3:
        row = "middle"
    else:
        row = "bottom"

    if x < 1 / 3:
        column = "left"
    elif x < 2 / 3:
        column = "center"
    else:
        column = "right"

    return f"{row} {column}"


def _find_last_observation(memory, object_id):
    """Return the most recent stored observation for an object."""
    for observation in reversed(memory):
        if observation.get("object_id") == object_id:
            return observation
    return None


def _has_moved(previous_position, current_position, previous_zone, current_zone):
    """Detect clear movement while filtering camera/detection jitter."""
    if not previous_position or not previous_zone:
        return False

    dx = abs(current_position["x"] - previous_position["x"])
    dy = abs(current_position["y"] - previous_position["y"])

    # For the MVP, a movement event should represent a meaningful spatial
    # change, not small bounding-box jitter inside the same zone.
    return previous_zone != current_zone and (dx >= MOVEMENT_THRESHOLD or dy >= MOVEMENT_THRESHOLD)


def record_positions(image, detections):
    """Attach identity + location + movement information and store observations."""
    memory = _load_memory()
    width, height = image.size

    if width <= 0 or height <= 0:
        return detections

    for detection in detections:
        box = detection.get("box")
        object_id = detection.get("object_id")

        if not box or len(box) != 4 or not object_id:
            continue

        x1, y1, x2, y2 = box
        center_x = (x1 + x2) / 2
        center_y = (y1 + y2) / 2

        position = {
            "x": round(center_x / width, 4),
            "y": round(center_y / height, 4),
        }

        zone = _get_zone(position["x"], position["y"])
        previous = _find_last_observation(memory, object_id)
        previous_location = previous.get("location", {}) if previous else {}
        previous_position = previous_location.get("position")

        previous_zone = previous_location.get("zone")
        moved = _has_moved(previous_position, position, previous_zone, zone)

        detection["position"] = position
        detection["zone"] = zone
        detection["moved"] = moved

        if moved:
            detection["movement"] = {
                "from": previous_zone,
                "to": zone,
            }

        observation = {
            "object_id": object_id,
            "identity": {
                "label": detection.get("label"),
                "identity_match": detection.get("identity_match", False),
            },
            "location": {
                "position": position,
                "zone": zone,
            },
        }

        if moved:
            observation["movement"] = {
                "from": previous_zone,
                "to": zone,
            }

        # Avoid storing identical consecutive observations.
        # A changed position or zone is stored as a new observation.
        if not memory or memory[-1] != observation:
            memory.append(observation)

    _save_memory(memory)
    return detections
