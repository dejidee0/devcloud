"use client";

import { useState } from "react";
import { Check, Copy, UserPlus } from "lucide-react";
import { Modal, Field } from "@/components/Modal";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { Avatar } from "@/components/ui";
import { api } from "@/lib/api";
import { usePoll } from "@/lib/use-poll";
import { relativeTime } from "@/lib/session";
import { PALETTE } from "@/lib/colors";
import type { User } from "@/types/models";

const ROLES = ["Developer", "ProductManager", "Client", "CoFounder"];
const ROLE_COLOR: Record<string, string> = { Owner: PALETTE.gold, CoFounder: PALETTE.purple, Developer: PALETTE.blue, ProductManager: PALETTE.cyan, Client: PALETTE.gray };

function tempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  const arr = new Uint32Array(14);
  crypto.getRandomValues(arr);
  for (const n of arr) out += chars[n % chars.length];
  return out;
}

export default function TeamPage() {
  const users = usePoll<User[]>("/api/users", 60000);
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ marginRight: "auto" }}>Team</h1>
        <button className="btn-primary" onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}><UserPlus size={16} /> Invite</button>
      </header>

      {users.loading ? <SkeletonLoader /> : users.error ? <p className="error-line">{users.error}</p> : (
        <div style={{ overflow: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
          <table className="responsive-table">
            <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Last active</th><th>Status</th></tr></thead>
            <tbody>
              {(users.data ?? []).map((u) => (
                <tr key={u.id}>
                  <td data-label="Name"><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Avatar name={u.fullName} /> {u.fullName}</span></td>
                  <td data-label="Role"><span style={{ color: ROLE_COLOR[u.role] ?? PALETTE.gray, background: `${ROLE_COLOR[u.role] ?? PALETTE.gray}1a`, border: `1px solid ${ROLE_COLOR[u.role] ?? PALETTE.gray}40`, borderRadius: 999, padding: "2px 8px", fontSize: 12 }}>{u.role}</span></td>
                  <td data-label="Email" style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                  <td data-label="Last active" style={{ color: "var(--text-secondary)" }}>{u.lastLogin ? relativeTime(u.lastLogin) : "never"}</td>
                  <td data-label="Status"><span style={{ color: u.isActive ? PALETTE.green : PALETTE.gray }}>{u.isActive ? "Active" : "Inactive"}</span></td>
                </tr>
              ))}
              {(users.data ?? []).length === 0 ? <tr><td colSpan={5} style={{ color: "var(--text-muted)" }}>No team members yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      )}

      {open ? <InviteModal onClose={() => setOpen(false)} onDone={() => void users.refresh()} /> : null}
    </div>
  );
}

function InviteModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Developer");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit() {
    setSaving(true); setError(null);
    try {
      const password = tempPassword();
      const name = fullName.trim() || email.split("@")[0];
      await api("/api/users", { method: "POST", body: JSON.stringify({ email, fullName: name, role, password }) });
      setCreated({ email, password });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function copy() {
    if (!created) return;
    void navigator.clipboard.writeText(`Email: ${created.email}\nTemporary password: ${created.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Modal title={created ? "Invite created" : "Invite team member"} onClose={onClose}>
      {created ? (
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>Share these credentials securely. The member should change the password after first login.</p>
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, display: "grid", gap: 6 }}>
            <div style={{ fontSize: 13 }}><span style={{ color: "var(--text-secondary)" }}>Email: </span><span className="mono">{created.email}</span></div>
            <div style={{ fontSize: 13 }}><span style={{ color: "var(--text-secondary)" }}>Temp password: </span><span className="mono" style={{ color: "var(--gold)" }}>{created.password}</span></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy credentials"}</button>
            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        </div>
      ) : (
        <>
          <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@company.com" /></Field>
          <Field label="Full name"><input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Optional — derived from email if blank" /></Field>
          <Field label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          {error ? <p className="error-line">{error}</p> : null}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn-primary" onClick={submit} disabled={saving || !email.trim()} style={{ flex: 1 }}>{saving ? "Creating…" : "Create & generate password"}</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </>
      )}
    </Modal>
  );
}
