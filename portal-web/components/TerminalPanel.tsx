"use client";

import dynamic from "next/dynamic";

const TerminalCore = dynamic(() => import("@/components/TerminalCore").then((m) => m.TerminalCore), { ssr: false });

export function TerminalPanel() {
  return (
    <section style={{ position: "fixed", left: 64, right: 0, bottom: 0, height: 210, borderTop: "1px solid var(--border-strong)", background: "var(--bg-surface)" }}>
      <div style={{ height: 34, display: "flex", alignItems: "center", padding: "0 12px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>Terminal</div>
      <TerminalCore />
    </section>
  );
}
