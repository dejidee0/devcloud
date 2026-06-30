"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Card, ProgressBar, SectionTitle, SeverityBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { usePoll } from "@/lib/use-poll";
import { relativeTime } from "@/lib/session";
import type { Project } from "@/types/models";

interface Finding { severity: string; title: string; detail: string; location?: string; recommendation?: string; }
interface Scan {
  id: string;
  projectId?: string;
  status: string;
  highestSeverity: string;
  riskScore: number;
  findingsCount: number;
  findingsJson: string;
  summary?: string;
  isAutomated: boolean;
  createdAt: string;
}

export default function AiSecurityPage() {
  const projects = useApi<Project[]>("/api/projects");
  const history = usePoll<Scan[]>("/api/ai/security-scans", 60000);
  const [projectId, setProjectId] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Scan | null>(null);

  async function runScan() {
    if (!projectId) { setError("Select a project first."); return; }
    setRunning(true); setError(null);
    try {
      const scan = await api<Scan>("/api/ai/security-scan", { method: "POST", body: JSON.stringify({ projectId }) });
      setSelected(scan);
      await history.refresh?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }

  const findings: Finding[] = selected ? safeParse(selected.findingsJson) : [];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ShieldCheck color="#b66bff" />
        <h1 style={{ margin: 0, fontSize: 22 }}>AI Security Scanner</h1>
        <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Secret &amp; vulnerability scanning powered by Claude</span>
      </header>

      <Card>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ minWidth: 220 }}>
            <option value="">Select a project…</option>
            {(projects.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={runScan} disabled={running} style={{ background: "#b66bff", color: "#0b0b0b", fontWeight: 600 }}>
            {running ? "Scanning…" : "Run scan"}
          </button>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Automated scans also run every 24h on active projects.</span>
        </div>
        {error ? <p className="error-line" style={{ marginTop: 10 }}>{error}</p> : null}
      </Card>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 5fr) minmax(0, 7fr)", gap: 16 }}>
        <Card>
          <SectionTitle>Scan History</SectionTitle>
          {history.loading ? <p style={{ color: "var(--text-muted)" }}>Loading…</p> : (
            <div style={{ display: "grid", gap: 6 }}>
              {(history.data ?? []).map((s) => (
                <button key={s.id} onClick={() => setSelected(s)} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-start", textAlign: "left", background: selected?.id === s.id ? "#161616" : "transparent" }}>
                  <SeverityBadge severity={s.highestSeverity} />
                  <span style={{ fontSize: 13 }}>{s.findingsCount} findings</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>{s.isAutomated ? "auto" : "manual"} · {relativeTime(s.createdAt)}</span>
                </button>
              ))}
              {(history.data ?? []).length === 0 ? <p style={{ color: "var(--text-muted)" }}>No scans yet.</p> : null}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle>Findings</SectionTitle>
          {!selected ? <p style={{ color: "var(--text-muted)" }}>Run or select a scan to view findings.</p> : (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ display: "flex", fontSize: 12, color: "var(--text-secondary)" }}>
                  <span>Risk score</span><span style={{ marginLeft: "auto", color: "var(--text-primary)" }}>{selected.riskScore}/100</span>
                </div>
                <ProgressBar value={selected.riskScore} />
              </div>
              {selected.summary ? <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>{selected.summary}</p> : null}
              {findings.map((f, i) => (
                <div key={i} style={{ borderLeft: "3px solid #b66bff", paddingLeft: 12, display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <SeverityBadge severity={f.severity} />
                    <strong style={{ fontSize: 14 }}>{f.title}</strong>
                    {f.location ? <span className="mono" style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>{f.location}</span> : null}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>{f.detail}</p>
                  {f.recommendation ? <p style={{ margin: 0, fontSize: 12, color: "var(--brand)" }}>→ {f.recommendation}</p> : null}
                </div>
              ))}
              {findings.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No findings recorded for this scan.</p> : null}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

function safeParse(json: string): Finding[] {
  try { const v = JSON.parse(json); return Array.isArray(v) ? v : []; } catch { return []; }
}
