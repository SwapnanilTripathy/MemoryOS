import { useEffect, useRef, useState } from "react";

const BACKEND_URL = "";

function Camera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Camera is off.");
  const [error, setError] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [detections, setDetections] = useState([]);
  const [facingMode, setFacingMode] = useState("environment");
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function enableCamera(mode = facingMode) {
    setError("");
    setUploadStatus("");
    setStatus("Requesting camera access...");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported by this browser.");
      setStatus("Camera unavailable.");
      return;
    }

    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());

      let stream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: mode } },
          audio: false,
        });
      } catch (exactError) {
        // Some browsers do not support exact facingMode constraints.
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        });
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setFacingMode(mode);
      setCameraActive(true);
      setStatus(mode === "environment" ? "Rear camera is live." : "Front camera is live.");
    } catch (err) {
      setCameraActive(false);
      setStatus("Camera is off.");
      setError(
        err?.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access and try again."
          : "Could not access the camera. Check that a camera is connected."
      );
    }
  }

  async function switchCamera() {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    await enableCamera(nextMode);
  }

  function captureImage() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !cameraActive) {
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
      const response = await fetch("/api/memory-frame", {
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
          <p className="camera-label">PHASE 5.5 · SPATIAL MEMORY</p>
          <h2>Memory Vision</h2>
        </div>
        <div className="camera-status-wrap">
          <span className={`camera-mode ${facingMode === "environment" ? "rear" : "front"}`}>
            {facingMode === "environment" ? "● REAR CAMERA" : "● FRONT CAMERA"}
          </span>
          <span className="camera-status">{status}</span>
        </div>
      </div>

      <div className="video-frame">
        <div className="camera-overlay">
          <span>MEMORYOS VISION</span>
          <span>{cameraActive ? "LIVE" : "READY"}</span>
        </div>
        <video ref={videoRef} autoPlay playsInline muted />
        {!cameraActive && (
          <div className="camera-placeholder">
            <span>◉</span>
            <p>Enable the rear camera to begin</p>
          </div>
        )}
      </div>

      {error && <p className="camera-error">{error}</p>}

      <div className="camera-actions">
        <button className="camera-button secondary-button" onClick={() => enableCamera()}>
          {cameraActive ? "Restart Rear Camera" : "Enable Rear Camera"}
        </button>

        <button
          className="camera-button flip-button"
          onClick={switchCamera}
          disabled={!cameraActive}
          title="Switch between rear and front camera"
        >
          ↻ Flip Camera
        </button>

        <button
          className="camera-button capture-button primary-capture"
          onClick={captureImage}
          disabled={!cameraActive}
        >
          ◉ Capture Memory
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
              const objectId = detection.object_id || "unassigned";

              return (
                <div
                  className="bounding-box"
                  key={`${objectId}-box-${index}`}
                  style={{
                    left: `${(x1 / width) * 100}%`,
                    top: `${(y1 / height) * 100}%`,
                    width: `${((x2 - x1) / width) * 100}%`,
                    height: `${((y2 - y1) / height) * 100}%`,
                  }}
                >
                  <span>
                    {objectId} · {detection.label} ·{" "}
                    {Math.round(detection.confidence * 100)}%
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
              <p className="capture-title">Detected Objects & Identity</p>
              <div className="detections-list">
                {detections.map((detection, index) => {
                  const objectId = detection.object_id || "unassigned";
                  const isPreviouslySeen = detection.identity_match === true;

                  return (
                    <div
                      className="detection-item"
                      key={`${objectId}-${index}`}
                    >
                      <div className="detection-info">
                        <strong>{detection.label}</strong>
                        <span className="object-id">ID: {objectId}</span>
                      </div>

                      <div className="detection-meta">
                        <span>
                          {Math.round(detection.confidence * 100)}%
                        </span>
                        <span
                          className={
                            isPreviouslySeen
                              ? "identity-status matched"
                              : "identity-status new"
                          }
                        >
                          {isPreviouslySeen ? "Previously seen" : "New object"}
                        </span>
                      </div>

                      <div className="location-info">
                        <span className="location-label">📍 Location</span>
                        <strong>
                          {detection.zone || "Unknown"}
                        </strong>
                        {detection.position && (
                          <span className="location-coordinates">
                            x: {detection.position.x} · y: {detection.position.y}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Camera;
