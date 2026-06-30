import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { avatarColor } from "@/lib/colors";

export function Card({ children, style, accent, ...rest }: { children: ReactNode; style?: CSSProperties; accent?: boolean } & HTMLAttributes<HTMLElement>) {
  return (
    <article
      className="dc-card"
      style={{
        background: "#0f0f0f",
        border: `1px solid ${accent ? "var(--brand)" : "#1f1f1f"}`,
        borderRadius: 12,
        padding: 16,
        transition: "transform 160ms cubic-bezier(0.16,1,0.3,1), border-color 160ms",
        ...style
      }}
      {...rest}
    >
      {children}
    </article>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{children}</h2>
      {action ? <div style={{ marginLeft: "auto" }}>{action}</div> : null}
    </div>
  );
}

export function ProgressBar({ value, max = 100, color }: { value: number; max?: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  const barColor = color ?? (pct > 85 ? "var(--danger)" : pct > 65 ? "var(--warning)" : "var(--brand)");
  return (
    <div style={{ height: 8, borderRadius: 999, background: "#1a1a1a", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 999, transition: "width 400ms ease" }} />
    </div>
  );
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#FF3B30",
  High: "#FF3B30",
  Warning: "#F5A623",
  Medium: "#F5A623",
  Suggestion: "#00D97E",
  Low: "#3b9eff",
  Info: "#888888"
};

export function SeverityBadge({ severity }: { severity: string }) {
  const color = SEVERITY_COLORS[severity] ?? "#888888";
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 999,
        color,
        background: `${color}1a`,
        border: `1px solid ${color}40`
      }}
    >
      {severity}
    </span>
  );
}

export function PulseDot({ color = "var(--brand)" }: { color?: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 9, height: 9 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: color, opacity: 0.55, animation: "dc-ping 1.6s cubic-bezier(0,0,0.2,1) infinite" }} />
      <span style={{ position: "relative", borderRadius: 999, width: 9, height: 9, background: color }} />
      <style>{"@keyframes dc-ping{75%,100%{transform:scale(2.4);opacity:0}}"}</style>
    </span>
  );
}

export function Avatar({ name, index = 0 }: { name: string; index?: number }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      title={name}
      style={{
        width: 28,
        height: 28,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        fontSize: 11,
        fontWeight: 700,
        color: "#0b0b0b",
        background: avatarColor(name || String(index)),
        border: "2px solid #0f0f0f",
        marginLeft: index === 0 ? 0 : -8
      }}
    >
      {initials || "?"}
    </span>
  );
}
