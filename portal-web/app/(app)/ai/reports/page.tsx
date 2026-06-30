"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui";
import { apiUrl, authToken } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { usePoll } from "@/lib/use-poll";
import { relativeTime } from "@/lib/session";
import type { Project } from "@/types/models";

interface ReportLog { id: string; resource: string; details?: string; createdAt: string; }

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

export default function AiReportsPage() {
  const projects = useApi<Project[]>("/api/projects");
  const history = usePoll<ReportLog[]>("/api/ai/reports", 60000);
  const [projectId, setProjectId] = useState("");
  const [start, setStart] = useState(isoDaysAgo(30));
  const [end, setEnd] = useState(isoDaysAgo(0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function generate() {
    if (!projectId) { setError("Select a project first."); return; }
    setLoading(true); setError(null); setPreviewUrl(null);
    try {
      const token = authToken();
      const res = await fetch(apiUrl("/api/ai/generate-report"), {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ projectId, startDate: new Date(start).toISOString(), endDate: new Date(end).toISOString() })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Report failed with ${res.status}`);
      }
      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
      await history.refresh?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 18, maxWidth: 980 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <FileText color="#b66bff" />
        <h1 style={{ margin: 0, fontSize: 22 }}>AI Project Reports</h1>
        <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Generate a professional PDF report</span>
      </header>

      <Card>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ minWidth: 200 }}>
            <option value="">Select a project…</option>
            {(projects.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <span style={{ color: "var(--text-muted)" }}>→</span>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          <button onClick={generate} disabled={loading} style={{ background: "#b66bff", color: "#0b0b0b", fontWeight: 600 }}>
            {loading ? "Generating…" : "Generate Report"}
          </button>
        </div>
        {error ? <p className="error-line" style={{ marginTop: 10 }}>{error}</p> : null}
      </Card>

      {previewUrl ? (
        <Card>
          <SectionTitle action={
            <a href={previewUrl} download="devcloud-report.pdf"><button style={{ display: "flex", alignItems: "center", gap: 6 }}><Download size={15} /> Download</button></a>
          }>Report preview</SectionTitle>
          <iframe title="Report preview" src={previewUrl} style={{ width: "100%", height: 520, border: "1px solid #1f1f1f", borderRadius: 8, background: "#fff" }} />
        </Card>
      ) : null}

      <Card>
        <SectionTitle>Previously generated</SectionTitle>
        {history.loading ? <p style={{ color: "var(--text-muted)" }}>Loading…</p> : (
          <div style={{ display: "grid", gap: 6 }}>
            {(history.data ?? []).map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "6px 0", borderBottom: "1px solid #161616" }}>
                <FileText size={15} color="var(--text-secondary)" />
                <span>{r.details ?? r.resource}</span>
                <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 11 }}>{relativeTime(r.createdAt)}</span>
              </div>
            ))}
            {(history.data ?? []).length === 0 ? <p style={{ color: "var(--text-muted)" }}>No reports generated yet.</p> : null}
          </div>
        )}
      </Card>
    </div>
  );
}
