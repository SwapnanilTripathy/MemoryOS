import Camera from "./Camera";

function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <strong>MEMORYOS</strong>
            <span>Physical memory for AI</span>
          </div>
        </div>

        <div className="system-pill">
          <span className="system-dot" />
          Memory system online
        </div>
      </header>

      <section className="welcome">
        <div>
          <p className="eyebrow">YOUR SPATIAL MEMORY</p>
          <h1>See it. Remember it.</h1>
          <p className="welcome-copy">
            Capture a scene and MEMORYOS remembers what was there, where it was,
            and when it changed.
          </p>
        </div>
        <div className="phase-card">
          <span>BUILD STATUS</span>
          <strong>Spatial memory</strong>
          <small>Identity · Location · Movement</small>
        </div>
      </section>

      <Camera />

      <footer className="app-footer">
        <span>MEMORYOS</span>
        <span>Physical Memory System</span>
      </footer>
    </main>
  );
}

export default App;
