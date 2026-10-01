import { useEffect, useRef, useState } from "react";

function Camera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Camera is off.");
  const [error, setError] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function enableCamera() {
    setError("");
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
    setError("");
  }

  return (
    <section className="camera-panel">
      <div className="camera-header">
        <div>
          <p className="camera-label">PHASE 2.4</p>
          <h2>Camera & Capture</h2>
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
          <img src={capturedImage} alt="Captured camera frame" />
        </div>
      )}
    </section>
  );
}

export default Camera;
