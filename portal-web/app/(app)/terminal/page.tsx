import { TerminalPanel } from "@/components/TerminalPanel";

export default function TerminalPage() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1>Terminal</h1>
      <p style={{ color: "var(--text-secondary)" }}>Teleport WebSocket target: <code className="mono">https://codemonk-devcloud-01:3080</code></p>
      <div style={{ height: 320, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", position: "relative" }}>
        <TerminalPanel />
      </div>
    </div>
  );
}
