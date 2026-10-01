import Camera from "./Camera";

function App() {
  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">PHYSICAL MEMORY SYSTEM</p>
        <h1>MEMORYOS</h1>
        <p className="tagline">Give an AI a physical memory.</p>
        <p className="status">Phase 2.3 — Live camera prototype.</p>

        <Camera />
      </section>
    </main>
  );
}

export default App;
