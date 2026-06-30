"use client";

import { useState } from "react";
import { ListPlus, Trash2 } from "lucide-react";
import { Card, SectionTitle, SeverityBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Project } from "@/types/models";

interface Draft {
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  suggestedAssigneeRole?: string;
  priority: "Low" | "Medium" | "High" | "Critical";
}

export default function AiTicketsPage() {
  const projects = useApi<Project[]>("/api/projects");
  const [projectId, setProjectId] = useState("");
  const [feature, setFeature] = useState("");
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

  async function generate() {
    if (!projectId) { setError("Select a project first."); return; }
    setLoading(true); setError(null); setSaved(null); setDrafts(null);
    try {
      const res = await api<{ tickets: Draft[] }>("/api/ai/generate-tickets", {
        method: "POST",
        body: JSON.stringify({ projectId, featureDescription: feature })
      });
      setDrafts(Array.isArray(res.tickets) ? res.tickets : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    if (!drafts || drafts.length === 0) return;
    setSaving(true); setError(null);
    try {
      const res = await api<{ created: number }>("/api/ai/tickets/confirm", {
        method: "POST",
        body: JSON.stringify({ projectId, tickets: drafts })
      });
      setSaved(res.created);
      setDrafts(null);
      setFeature("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function update(i: number, patch: Partial<Draft>) {
    setDrafts((prev) => prev ? prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)) : prev);
  }
  function remove(i: number) {
    setDrafts((prev) => prev ? prev.filter((_, idx) => idx !== i) : prev);
  }

  return (
    <div style={{ display: "grid", gap: 18, maxWidth: 980 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ListPlus color="#b66bff" />
        <h1 style={{ margin: 0, fontSize: 22 }}>AI Ticket Generator</h1>
        <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Turn a feature into engineering tickets</span>
      </header>

      <Card>
        <div style={{ display: "grid", gap: 10 }}>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Select a project…</option>
            {(projects.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <textarea placeholder="e.g. Add Paystack payment to checkout" value={feature} onChange={(e) => setFeature(e.target.value)} rows={3} style={{ resize: "vertical" }} />
          <button onClick={generate} disabled={loading || !feature.trim()} style={{ background: "#b66bff", color: "#0b0b0b", fontWeight: 600, justifySelf: "start" }}>
            {loading ? "Generating…" : "Generate with AI"}
          </button>
          {error ? <p className="error-line">{error}</p> : null}
          {saved !== null ? <p style={{ color: "var(--brand)" }}>✓ Created {saved} ticket{saved === 1 ? "" : "s"}.</p> : null}
        </div>
      </Card>

      {drafts ? (
        <Card>
          <SectionTitle action={
            <button onClick={confirm} disabled={saving || drafts.length === 0} style={{ background: "var(--brand)", color: "#0b0b0b", fontWeight: 600 }}>
              {saving ? "Saving…" : `Create ${drafts.length} ticket${drafts.length === 1 ? "" : "s"}`}
            </button>
          }>Review &amp; edit before saving</SectionTitle>
          <div style={{ display: "grid", gap: 12 }}>
            {drafts.map((d, i) => (
              <div key={i} style={{ border: "1px solid #1f1f1f", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input value={d.title} onChange={(e) => update(i, { title: e.target.value })} style={{ flex: 1, fontWeight: 600 }} />
                  <select value={d.priority} onChange={(e) => update(i, { priority: e.target.value as Draft["priority"] })}>
                    {["Low", "Medium", "High", "Critical"].map((p) => <option key={p}>{p}</option>)}
                  </select>
                  <SeverityBadge severity={d.priority} />
                  <button onClick={() => remove(i)} title="Remove" style={{ padding: "6px 8px" }}><Trash2 size={14} /></button>
                </div>
                <textarea value={d.description ?? ""} onChange={(e) => update(i, { description: e.target.value })} rows={2} style={{ fontSize: 13, resize: "vertical" }} />
                {d.acceptanceCriteria ? <div style={{ fontSize: 12, color: "var(--text-secondary)" }}><strong>AC:</strong> {d.acceptanceCriteria}</div> : null}
                {d.suggestedAssigneeRole ? <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Suggested role: {d.suggestedAssigneeRole}</div> : null}
              </div>
            ))}
            {drafts.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No tickets to create.</p> : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
