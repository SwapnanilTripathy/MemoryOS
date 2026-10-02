import json
from pathlib import Path

import numpy as np
from PIL import Image

IDENTITY_FILE = Path(__file__).resolve().parent.parent / "database" / "object_identities.json"

GRAY_SIZE = 24
COLOR_BINS = 8
MATCH_THRESHOLD = 0.34


def _load_identities():
    if not IDENTITY_FILE.exists():
        return []

    try:
        return json.loads(IDENTITY_FILE.read_text())
    except (OSError, json.JSONDecodeError):
        return []


def _save_identities(identities):
    IDENTITY_FILE.parent.mkdir(parents=True, exist_ok=True)
    IDENTITY_FILE.write_text(json.dumps(identities, indent=2))


def _fingerprint(image):
    rgb = image.convert("RGB")
    small = rgb.resize((GRAY_SIZE, GRAY_SIZE))
    gray = np.asarray(small.convert("L"), dtype=np.float32) / 255.0
    gray = (gray - gray.mean()) / (gray.std() + 1e-6)

    hsv = np.asarray(small.convert("HSV"), dtype=np.uint8)
    color_features = []

    for channel in range(3):
        histogram, _ = np.histogram(
            hsv[:, :, channel],
            bins=COLOR_BINS,
            range=(0, 256),
            density=True,
        )
        histogram = histogram.astype(np.float32)
        histogram /= histogram.sum() + 1e-6
        color_features.extend(histogram.tolist())

    return {
        "gray": gray.flatten().tolist(),
        "color": color_features,
    }


def _distance(first, second):
    first_gray = np.asarray(first["gray"], dtype=np.float32)
    second_gray = np.asarray(second["gray"], dtype=np.float32)
    gray_distance = float(np.mean(np.abs(first_gray - second_gray)))

    first_color = np.asarray(first["color"], dtype=np.float32)
    second_color = np.asarray(second["color"], dtype=np.float32)
    color_distance = float(np.mean(np.abs(first_color - second_color)))

    return (0.7 * gray_distance) + (0.3 * color_distance)


def identify_objects(image, detections):
    identities = _load_identities()
    next_number = len(identities) + 1

    for detection in detections:
        x1, y1, x2, y2 = map(int, detection["box"])

        width = x2 - x1
        height = y2 - y1
        pad_x = int(width * 0.08)
        pad_y = int(height * 0.08)

        crop = image.crop((
            max(0, x1 - pad_x),
            max(0, y1 - pad_y),
            min(image.width, x2 + pad_x),
            min(image.height, y2 + pad_y),
        ))

        if crop.width < 2 or crop.height < 2:
            continue

        fingerprint = _fingerprint(crop)
        best = None

        for identity in identities:
            if identity.get("label") != detection["label"]:
                continue
            if not isinstance(identity.get("fingerprint"), dict):
                continue

            distance = _distance(fingerprint, identity["fingerprint"])

            if best is None or distance < best[0]:
                best = (distance, identity)

        if best and best[0] <= MATCH_THRESHOLD:
            object_id = best[1]["object_id"]
            match_distance = best[0]
        else:
            object_id = f"object_{next_number:03d}"
            next_number += 1
            identities.append({
                "object_id": object_id,
                "label": detection["label"],
                "fingerprint": fingerprint,
            })
            match_distance = None

        detection["object_id"] = object_id
        detection["identity_match"] = match_distance is not None

    _save_identities(identities)
    return detections
