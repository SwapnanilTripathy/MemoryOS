from ultralytics import YOLO

MODEL_NAME = "yolo11n.pt"

_model = None

def get_model():
    global _model

    if _model is None:
        print(f"Loading object detection model: {MODEL_NAME}")
        _model = YOLO(MODEL_NAME)

    return _model

def detect_objects(image):
    model = get_model()
    results = model(image, verbose=False)

    detections = []

    for result in results:
        names = result.names

        if result.boxes is None:
            continue

        for box in result.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            x1, y1, x2, y2 = [round(float(value), 2) for value in box.xyxy[0]]

            detections.append({
                "label": names[class_id],
                "confidence": round(confidence, 3),
                "box": [x1, y1, x2, y2],
            })

    return detections
