import { useEffect, useRef, useState } from "react";

const BACKEND_URL = "http://localhost:8000";

function Camera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Camera is off.");
  const [error, setError] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [detections, setDetections] = useState([]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function enableCamera() {
    setError("");
    setUploadStatus("");
    setStatus("Requesting camera access...");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported by this browser.");
      setStatus("Camera unavailable.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setStatus("Camera is live.");
    } catch (err) {
      setStatus("Camera is off.");
      setError(
        err?.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access and try again."
          : "Could not access the camera. Check that a camera is connected."
      );
    }
  }

  function captureImage() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !streamRef.current) {
      setError("Enable the camera before capturing an image.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    setCapturedImage(canvas.toDataURL("image/jpeg", 0.9));
    setUploadStatus("");
    setDetections([]);
    setError("");
  }

  async function sendImageToBackend() {
    if (!capturedImage) {
      setError("Capture an image before sending it.");
      return;
    }

    setError("");
    setUploadStatus("Sending image to backend...");

    try {
      const response = await fetch(`${BACKEND_URL}/api/memory-frame`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: capturedImage }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Backend rejected the image.");
      }

      setDetections(data.detections || []);
      setUploadStatus(`✓ Detected ${data.detections?.length || 0} object(s).`);
    } catch (err) {
      setUploadStatus("");
      setError(
        "Could not reach the backend. Make sure server.py is running on port 8000."
      );
    }
  }

  return (
    <section className="camera-panel">
      <div className="camera-header">
        <div>
          <p className="camera-label">PHASE 2.6</p>
          <h2>Camera & Memory Frame</h2>
        </div>
        <span className="camera-status">{status}</span>
      </div>

      <div className="video-frame">
        <video ref={videoRef} autoPlay playsInline muted />
        {!streamRef.current && (
          <div className="camera-placeholder">
            <span>📷</span>
            <p>Camera preview will appear here</p>
          </div>
        )}
      </div>

      {error && <p className="camera-error">{error}</p>}

      <div className="camera-actions">
        <button className="camera-button" onClick={enableCamera}>
          Enable Camera
        </button>

        <button
          className="camera-button capture-button"
          onClick={captureImage}
          disabled={!streamRef.current}
        >
          Capture Image
        </button>
      </div>

      <canvas ref={canvasRef} hidden />

      {capturedImage && (
        <div className="capture-preview">
          <p className="capture-title">Captured Memory Frame</p>
          <div className="annotated-image">
            <img src={capturedImage} alt="Captured camera frame" />
            {detections.map((detection, index) => {
              const [x1, y1, x2, y2] = detection.box || [];
              const image = new Image();
              image.src = capturedImage;

              const width = image.naturalWidth || 1;
              const height = image.naturalHeight || 1;

              return (
                <div
                  className="bounding-box"
                  key={`${detection.label}-box-${index}`}
                  style={{
                    left: `${(x1 / width) * 100}%`,
                    top: `${(y1 / height) * 100}%`,
                    width: `${((x2 - x1) / width) * 100}%`,
                    height: `${((y2 - y1) / height) * 100}%`,
                  }}
                >
                  <span>
                    {detection.label} {Math.round(detection.confidence * 100)}%
                  </span>
                </div>
              );
            })}
          </div>

          <button className="camera-button send-button" onClick={sendImageToBackend}>
            Send to MemoryOS
          </button>

          {uploadStatus && <p className="upload-status">{uploadStatus}</p>}

          {detections.length > 0 && (
            <div className="detections-panel">
              <p className="capture-title">Detected Objects</p>
              <div className="detections-list">
                {detections.map((detection, index) => (
                  <div className="detection-item" key={`${detection.label}-${index}`}>
                    <span>{detection.label}</span>
                    <span>{Math.round(detection.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Camera;
