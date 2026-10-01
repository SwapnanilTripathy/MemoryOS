# MEMORYOS Backend

Backend for the MEMORYOS camera and object-detection pipeline.

## Run

From the repository root:

```bash
cd backend
pip install -r requirements.txt
cd ..
python backend/server.py
```

The API runs at:

```
http://localhost:8000
```

## Endpoint

`POST /api/memory-frame`

Request body:

```json
{
  "image": "data:image/jpeg;base64,..."
}
```

The backend now:
1. Receives the captured camera frame.
2. Decodes the image.
3. Runs lightweight YOLO object detection.
4. Creates a visual fingerprint for each detected object and assigns a persistent object ID.

The first detection run downloads the YOLO model automatically.

AI memory, object identity, spatial memory, and temporal memory will be added in later phases.
