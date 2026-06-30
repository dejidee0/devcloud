"use client";

import dynamic from "next/dynamic";
import { Terminal as TerminalIcon } from "lucide-react";

const InteractiveTerminal = dynamic(() => import("@/components/InteractiveTerminal").then((m) => m.InteractiveTerminal), {
  ssr: false,
  loading: () => <p style={{ color: "var(--text-secondary)" }}>Loading terminal…</p>
});

export default function TerminalPage() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <TerminalIcon color="var(--cyan)" />
        <h1 style={{ margin: 0 }}>Terminal</h1>
        <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Live root shell on the Hetzner host (Owner only)</span>
      </header>
      <InteractiveTerminal />
    </div>
  );
}
