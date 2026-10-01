import { useEffect, useRef, useState } from "react";

function Camera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("Camera is off.");
  const [error, setError] = useState("");

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

  return (
    <section className="camera-panel">
      <div className="camera-header">
        <div>
          <p className="camera-label">PHASE 2.3</p>
          <h2>Live Camera</h2>
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

      <button className="camera-button" onClick={enableCamera}>
        Enable Camera
      </button>
    </section>
  );
}

export default Camera;
