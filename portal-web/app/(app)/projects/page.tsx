"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal, Field } from "@/components/Modal";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { TechStackBadge } from "@/components/TechStackBadge";
import { api } from "@/lib/api";
import { usePoll } from "@/lib/use-poll";
import { currentUser } from "@/lib/session";
import { statusColor } from "@/lib/colors";
import type { Project, TechStack } from "@/types/models";

const STACKS: TechStack[] = ["DotNet", "NodeJS", "Python", "Java", "React", "Flutter", "CPP"];

export default function ProjectsPage() {
  const { data, error, loading, refresh } = usePoll<Project[]>("/api/projects", 60000);
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ marginRight: "auto" }}>Projects</h1>
        <button className="btn-primary" onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} /> New project</button>
      </header>

      {loading ? <SkeletonLoader /> : error ? <p className="error-line">{error}</p> : (
        <div style={{ overflow: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
          <table className="responsive-table">
            <thead><tr><th>Name</th><th>Client</th><th>Stack</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {(data ?? []).map((p) => (
                <tr key={p.id}>
                  <td data-label="Name"><strong>{p.name}</strong></td>
                  <td data-label="Client">{p.clientName}</td>
                  <td data-label="Stack"><TechStackBadge stack={p.techStack} /></td>
                  <td data-label="Status"><span style={{ color: statusColor(p.status) }}>{p.status}</span></td>
                  <td data-label="Created" style={{ color: "var(--text-secondary)" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {(data ?? []).length === 0 ? <tr><td colSpan={5} style={{ color: "var(--text-muted)" }}>No projects yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      )}

      {open ? <NewProjectModal onClose={() => setOpen(false)} onCreated={() => { setOpen(false); void refresh(); }} /> : null}
    </div>
  );
}

function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [techStack, setTechStack] = useState<TechStack>("DotNet");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true); setError(null);
    try {
      const ownerId = currentUser()?.userId;
      if (!ownerId) throw new Error("No active session.");
      await api("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name, description, clientName, status: "Active", techStack, ownerId })
      });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New project" onClose={onClose}>
      <Field label="Project name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Paystack Checkout" /></Field>
      <Field label="Client"><input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Acme Corp" /></Field>
      <Field label="Tech stack">
        <select value={techStack} onChange={(e) => setTechStack(e.target.value as TechStack)}>
          {STACKS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ resize: "vertical" }} placeholder="Short description (optional)" /></Field>
      {error ? <p className="error-line">{error}</p> : null}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button className="btn-primary" onClick={submit} disabled={saving || !name.trim() || !clientName.trim()} style={{ flex: 1 }}>{saving ? "Creating…" : "Create project"}</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
