import json
from pathlib import Path

import numpy as np
from PIL import Image

IDENTITY_FILE = Path(__file__).resolve().parent.parent / "database" / "object_identities.json"
HASH_SIZE = 16
MATCH_THRESHOLD = 35


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
    small = image.resize((HASH_SIZE, HASH_SIZE)).convert("L")
    pixels = np.asarray(small, dtype=np.float32)
    mean = pixels.mean()
    bits = (pixels >= mean).flatten()
    return "".join("1" if bit else "0" for bit in bits)


def _distance(first, second):
    return sum(a != b for a, b in zip(first, second))


def identify_objects(image, detections):
    identities = _load_identities()
    next_number = len(identities) + 1

    for detection in detections:
        x1, y1, x2, y2 = map(int, detection["box"])
        crop = image.crop((x1, y1, x2, y2))

        if crop.width < 2 or crop.height < 2:
            continue

        fingerprint = _fingerprint(crop)
        best = None

        for identity in identities:
            if identity["label"] != detection["label"]:
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
