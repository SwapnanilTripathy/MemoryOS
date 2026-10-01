# MEMORYOS Backend

Minimal backend for the MEMORYOS camera pipeline.

## Run

From the repository root:

```bash
cd backend
python server.py
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

For now the backend only confirms that the image was received. AI processing will be added in later phases.
