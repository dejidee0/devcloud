"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "min(480px, 100%)" }}>
        <h1>DevCloud hit an error</h1>
        <p className="error-line">{error.message}</p>
        <button onClick={reset}>Retry</button>
      </section>
    </main>
  );
}
