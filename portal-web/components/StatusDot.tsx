export function StatusDot({ status = "ok" }: { status?: "ok" | "warn" | "danger" }) {
  const color = status === "ok" ? "var(--success)" : status === "warn" ? "var(--warning)" : "var(--danger)";
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 8, background: color, animation: "pulse 1.6s infinite" }} />;
}
