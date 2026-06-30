"use client";

import { useState } from "react";
import { ChevronDown, Globe, RefreshCw, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui";
import { usePoll } from "@/lib/use-poll";
import { relativeTime } from "@/lib/session";

interface OpenPort { port: number; service: string; risk: string; note: string; process: string; }
interface NetworkVerification {
  publicIp?: string | null;
  location: { city?: string; region?: string; country?: string; isp?: string; lat?: number; lng?: number };
  dnsLeakDetected: boolean;
  openPorts: OpenPort[];
  anyDeskOrRdpDetected: boolean;
  firewallActive: boolean;
  status: string;
  verified: boolean;
  lastVerified: string;
}

const RISK_COLOR: Record<string, string> = { low: "#00D97E", medium: "#F5A623", high: "#FF3B30" };
// Server fallback coords (Falkenstein, Germany)
const FALLBACK = { lat: 50.4779, lng: 12.3713 };

export function NetworkVerificationCard() {
  const net = usePoll<NetworkVerification>("/api/infrastructure/network-verification", 60000);
  const [expanded, setExpanded] = useState(false);

  const data = net.data;
  const clean = data?.status === "Verified Clean";
  const reviewable = data?.status === "Review Needed";
  const lat = data?.location?.lat ?? FALLBACK.lat;
  const lng = data?.location?.lng ?? FALLBACK.lng;
  // Equirectangular projection into a 360x180 viewBox.
  const dotX = lng + 180;
  const dotY = 90 - lat;

  return (
    <Card>
      <SectionTitle action={
        <button onClick={() => net.refresh()} title="Re-verify now" aria-label="Re-verify now" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "5px 9px" }}>
          <RefreshCw size={13} /> Re-verify
        </button>
      }>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Globe size={16} color="#3b9eff" /> Network Verification</span>
      </SectionTitle>

      {net.loading && !data ? <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Verifying…</p> : net.error && !data ? (
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          {net.error.toLowerCase().includes("config") || net.error.includes("503") ? "DEVCLOUD_SSH_KEY not configured on server." : "Unable to verify network."}
        </p>
      ) : data ? (
        <div style={{ display: "grid", gap: 14 }}>
          {/* Status badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {clean ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#00D97E", background: "#00D97E1a", border: "1px solid #00D97E55", borderRadius: 999, padding: "6px 14px" }}>
                <ShieldCheck size={16} /> Verified Clean
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, color: reviewable ? "#F5A623" : "#888", background: reviewable ? "#F5A6231a" : "#88888818", border: `1px solid ${reviewable ? "#F5A62355" : "#88888855"}`, borderRadius: 999, padding: "6px 14px" }}>
                <ShieldAlert size={16} /> {data.status === "unable to verify" ? "Unable to Verify" : "Review Needed"}
              </span>
            )}
          </div>

          {/* Mini world map with pulsing dot at server location */}
          <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid #1f1f1f", background: "radial-gradient(ellipse at center, #0d1726, #0a0a0a)" }}>
            <svg viewBox="0 0 360 180" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: 150, display: "block" }}>
              <defs>
                <radialGradient id="netdot" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00D97E" />
                  <stop offset="100%" stopColor="#00D97E00" />
                </radialGradient>
              </defs>
              {/* graticule */}
              {[30, 60, 90, 120, 150].map((y) => <line key={`h${y}`} x1={0} y1={y} x2={360} y2={y} stroke="#1f2c3f" strokeWidth={0.5} />)}
              {[60, 120, 180, 240, 300].map((x) => <line key={`v${x}`} x1={x} y1={0} x2={x} y2={180} stroke="#1f2c3f" strokeWidth={0.5} />)}
              {/* stylised landmass dots */}
              {LAND.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.1} fill="#24405f" />)}
              {/* pulsing server dot */}
              <circle cx={dotX} cy={dotY} r={14} fill="url(#netdot)">
                <animate attributeName="r" values="6;16;6" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2.2s" repeatCount="indefinite" />
              </circle>
              <circle cx={dotX} cy={dotY} r={2.6} fill="#00D97E" stroke="#0a0a0a" strokeWidth={0.6} />
            </svg>
            <span style={{ position: "absolute", bottom: 6, left: 8, fontSize: 10, color: "var(--text-muted)" }}>
              {data.location?.city ?? "—"}{data.location?.country ? `, ${data.location.country}` : ""}
            </span>
          </div>

          {/* Detail rows */}
          <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
            <Row label="Public IP" value={data.publicIp ?? "unable to verify"} mono />
            <Row label="Location" value={[data.location?.city, data.location?.country].filter(Boolean).join(", ") || "—"} />
            <Row label="ISP" value={data.location?.isp ?? "—"} />
            <Row label="DNS Leak" value={data.dnsLeakDetected ? "Detected" : "None"} color={data.dnsLeakDetected ? "#FF3B30" : "#00D97E"} />
            <Row label="Open Ports" value={`${data.openPorts.length}`} />
            <Row label="Firewall" value={data.firewallActive ? "Active" : "Inactive"} color={data.firewallActive ? "#00D97E" : "#F5A623"} />
            <Row label="RDP/AnyDesk" value={data.anyDeskOrRdpDetected ? "Detected" : "Not detected"} color={data.anyDeskOrRdpDetected ? "#FF3B30" : "#00D97E"} />
          </div>

          {/* Expandable port list */}
          <div>
            <button onClick={() => setExpanded((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "5px 0", background: "transparent", border: "none", color: "var(--text-secondary)" }}>
              <ChevronDown size={14} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 160ms" }} /> {expanded ? "Hide" : "Show"} open ports
            </button>
            {expanded ? (
              <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                {data.openPorts.map((p) => (
                  <div key={p.port} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "6px 8px", border: "1px solid #161616", borderRadius: 8 }}>
                    <span className="mono" style={{ minWidth: 48 }}>{p.port}</span>
                    <span style={{ flex: 1 }}>{p.service}{p.note ? <span style={{ color: "var(--text-muted)" }}> · {p.note}</span> : null}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: RISK_COLOR[p.risk] ?? "#888", background: `${RISK_COLOR[p.risk] ?? "#888"}1a`, border: `1px solid ${RISK_COLOR[p.risk] ?? "#888"}40`, borderRadius: 999, padding: "2px 8px" }}>{p.risk}</span>
                  </div>
                ))}
                {data.openPorts.length === 0 ? <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No listening ports detected.</p> : null}
              </div>
            ) : null}
          </div>

          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Last verified {relativeTime(data.lastVerified)}</span>
        </div>
      ) : null}
    </Card>
  );
}

function Row({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span className={mono ? "mono" : undefined} style={{ marginLeft: "auto", color: color ?? "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

// Rough decorative landmass dots in 360x180 equirectangular space (purely visual).
const LAND: Array<[number, number]> = [
  [70, 55], [78, 50], [85, 58], [62, 62], [95, 70], [88, 78], [100, 60],
  [175, 45], [185, 50], [192, 48], [200, 55], [183, 62], [178, 70], [195, 72], [205, 64], [188, 80], [196, 95], [185, 105], [200, 110],
  [255, 55], [265, 50], [275, 58], [285, 52], [295, 60], [270, 66], [283, 70], [300, 68],
  [300, 120], [310, 128], [305, 135],
  [60, 110], [68, 120], [58, 125], [72, 132]
];
