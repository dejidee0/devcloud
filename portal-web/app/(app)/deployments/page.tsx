"use client";

import { useState } from "react";
import { Plus, RotateCcw, Rocket } from "lucide-react";
import { Modal, Field } from "@/components/Modal";
import { Card } from "@/components/ui";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { usePoll } from "@/lib/use-poll";
import { currentUser, relativeTime } from "@/lib/session";
import { statusColor } from "@/lib/colors";
import type { Deployment, Project } from "@/types/models";

export default function DeploymentsPage() {
  const deployments = usePoll<Deployment[]>("/api/deployments", 30000);
  const [open, setOpen] = useState(false);
  const rows = deployments.data ?? [];

  async function rollback(id: string) {
    try { await api(`/api/deployments/${id}/rollback`, { method: "POST" }); await deployments.refresh(); }
    catch { /* ignore */ }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ marginRight: "auto" }}>Deployments</h1>
        {rows.length > 0 ? <button className="btn-primary" onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} /> New Deployment</button> : null}
      </header>

      {deployments.loading ? <SkeletonLoader /> : deployments.error ? <p className="error-line">{deployments.error}</p> : rows.length === 0 ? (
        <Card style={{ display: "grid", placeItems: "center", gap: 14, padding: "48px 20px", textAlign: "center" }}>
          <span style={{ width: 56, height: 56, borderRadius: 16, display: "grid", placeItems: "center", background: "var(--gold-dim)", color: "var(--gold)" }}><Rocket size={26} /></span>
          <div>
            <h2 style={{ margin: "0 0 4px" }}>No deployments yet</h2>
            <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: 14 }}>Ship your first build to staging or production.</p>
          </div>
          <button className="btn-primary" onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} /> New Deployment</button>
        </Card>
      ) : (
        <div style={{ overflow: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
          <table className="responsive-table">
            <thead><tr><th>Environment</th><th>Status</th><th>Commit</th><th>Started</th><th>Action</th></tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td data-label="Environment">{d.environment}</td>
                  <td data-label="Status"><span style={{ fontSize: 12, fontWeight: 600, color: statusColor(d.status), background: `${statusColor(d.status)}1a`, border: `1px solid ${statusColor(d.status)}40`, borderRadius: 999, padding: "2px 9px" }}>{d.status}</span></td>
                  <td data-label="Commit" className="mono" style={{ color: "var(--text-secondary)" }}>{d.commitHash?.slice(0, 9) || "—"}</td>
                  <td data-label="Started" style={{ color: "var(--text-secondary)" }}>{relativeTime(d.startedAt)}</td>
                  <td data-label="Action"><button onClick={() => rollback(d.id)} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, padding: "5px 12px" }}><RotateCcw size={13} /> Rollback</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open ? <NewDeploymentModal onClose={() => setOpen(false)} onDone={() => { setOpen(false); void deployments.refresh(); }} /> : null}
    </div>
  );
}

function NewDeploymentModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const projects = useApi<Project[]>("/api/projects");
  const [projectId, setProjectId] = useState("");
  const [environment, setEnvironment] = useState("Staging");
  const [commitHash, setCommitHash] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!projectId) { setError("Select a project."); return; }
    setSaving(true); setError(null);
    try {
      const deployedById = currentUser()?.userId;
      await api("/api/deployments", {
        method: "POST",
        body: JSON.stringify({ projectId, environment, commitHash: commitHash || null, deployedById })
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New deployment" onClose={onClose}>
      <Field label="Project">
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">Select a project…</option>
          {(projects.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Environment">
        <select value={environment} onChange={(e) => setEnvironment(e.target.value)}>
          <option value="Staging">Staging</option>
          <option value="Production">Production</option>
        </select>
      </Field>
      <Field label="Commit hash / notes (optional)"><input value={commitHash} onChange={(e) => setCommitHash(e.target.value)} placeholder="e.g. a1b2c3d or release note" /></Field>
      {error ? <p className="error-line">{error}</p> : null}
      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Deploys pull the latest code and rebuild the project&apos;s containers on the server.</p>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button className="btn-primary" onClick={submit} disabled={saving} style={{ flex: 1 }}>{saving ? "Deploying…" : "Deploy"}</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
