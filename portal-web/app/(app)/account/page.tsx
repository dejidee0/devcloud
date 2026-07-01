"use client";

import { useEffect, useState } from "react";
import { Check, Download, Lock, Pencil, ShieldCheck, UserCircle } from "lucide-react";
import { Button, Card, ProgressBar, SectionTitle } from "@/components/ui";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { usePoll } from "@/lib/use-poll";
import { currentUser, relativeTime } from "@/lib/session";
import { avatarColor, PALETTE } from "@/lib/colors";

interface Profile {
  id: string; fullName: string; email: string; role: string; organization: string;
  createdAt: string; lastLogin?: string | null;
  projectsOwned: number; teamMembers: number; environments: number;
}
interface LoginSession { id: string; ipAddress?: string | null; createdAt: string; }

function scorePassword(v: string): number {
  let s = 0;
  if (v.length >= 8) s++;
  if (v.length >= 12) s++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return Math.min(s, 4);
}
const STRENGTH = ["Very weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = [PALETTE.red, PALETTE.red, PALETTE.orange, PALETTE.gold, PALETTE.green];

export default function AccountPage() {
  const profile = usePoll<Profile>("/api/account/profile", 60000);
  const sessions = usePoll<LoginSession[]>("/api/account/sessions", 60000);
  const isOwner = currentUser()?.role === "Owner";

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 1040 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <UserCircle color={PALETTE.gold} />
        <h1 style={{ margin: 0 }}>My Account</h1>
      </header>

      {profile.loading ? <SkeletonLoader rows={3} /> : profile.error ? <p className="error-line">{profile.error}</p> : profile.data ? (
        <>
          <ProfileCard profile={profile.data} onSaved={() => void profile.refresh()} />
          <section className="split-2">
            <SecurityColumn sessions={sessions.data ?? []} sessionsLoading={sessions.loading} onRevoked={() => void sessions.refresh()} />
            <DetailsColumn profile={profile.data} onSaved={() => void profile.refresh()} />
          </section>
          {isOwner ? <DangerZone /> : null}
        </>
      ) : null}
    </div>
  );
}

function ProfileCard({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.fullName);
  const [saving, setSaving] = useState(false);
  useEffect(() => setName(profile.fullName), [profile.fullName]);
  const initials = profile.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const dirty = name.trim() !== profile.fullName && name.trim().length > 0;

  async function save() {
    setSaving(true);
    try { await api("/api/account/profile", { method: "PUT", body: JSON.stringify({ fullName: name.trim() }) }); setEditing(false); onSaved(); }
    finally { setSaving(false); }
  }

  return (
    <Card style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ width: 76, height: 76, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 26, fontWeight: 700, color: "#0b0b0b", background: `linear-gradient(135deg, ${avatarColor(profile.email)}, #FFC861)`, flexShrink: 0 }}>{initials || "?"}</span>
      <div style={{ flex: 1, minWidth: 240, display: "grid", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {editing ? (
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ fontSize: 18, maxWidth: 280 }} />
          ) : (
            <strong style={{ fontSize: 20 }}>{profile.fullName}</strong>
          )}
          <button onClick={() => setEditing((v) => !v)} title="Edit name" aria-label="Edit name" style={{ padding: 6, minHeight: 0, background: "transparent", border: "1px solid var(--border-strong)", borderRadius: 6, color: "var(--text-secondary)" }}><Pencil size={14} /></button>
          <span style={{ fontSize: 12, fontWeight: 700, color: PALETTE.gold, background: "var(--gold-dim)", border: "1px solid rgba(245,166,35,0.4)", borderRadius: 999, padding: "2px 10px" }}>{profile.role}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 13 }}>
          <Lock size={13} /> <span className="mono">{profile.email}</span>
        </div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12, color: "var(--text-muted)" }}>
          <span>Member since {new Date(profile.createdAt).toLocaleDateString()}</span>
          <span>Last login {profile.lastLogin ? relativeTime(profile.lastLogin) : "—"}</span>
        </div>
      </div>
      {editing && dirty ? <Button onClick={save} disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{saving ? "Saving…" : "Save Changes"}</Button> : null}
    </Card>
  );
}

function SecurityColumn({ sessions, sessionsLoading, onRevoked }: { sessions: LoginSession[]; sessionsLoading: boolean; onRevoked: () => void }) {
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [conf, setConf] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const strength = nw ? scorePassword(nw) : 0;

  async function changePassword() {
    if (nw !== conf) { setMsg({ ok: false, text: "New passwords do not match." }); return; }
    setBusy(true); setMsg(null);
    try {
      await api("/api/account/change-password", { method: "POST", body: JSON.stringify({ currentPassword: cur, newPassword: nw }) });
      setMsg({ ok: true, text: "Password updated." }); setCur(""); setNw(""); setConf("");
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally { setBusy(false); }
  }

  async function revoke() {
    try { await api("/api/account/revoke-sessions", { method: "POST" }); setToast("Other sessions revoked."); onRevoked(); setTimeout(() => setToast(null), 2000); }
    catch { /* ignore */ }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <SectionTitle>Change Password</SectionTitle>
        <div style={{ display: "grid", gap: 10 }}>
          <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="Current password" autoComplete="current-password" />
          <input type="password" value={nw} onChange={(e) => setNw(e.target.value)} placeholder="New password" autoComplete="new-password" />
          {nw ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 999, background: "#1a1a1a", overflow: "hidden" }}>
                <div style={{ width: `${((strength + 1) / 5) * 100}%`, height: "100%", background: STRENGTH_COLOR[strength], transition: "width 200ms" }} />
              </div>
              <span style={{ fontSize: 12, color: STRENGTH_COLOR[strength] }}>{STRENGTH[strength]}</span>
            </div>
          ) : null}
          <input type="password" value={conf} onChange={(e) => setConf(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" />
          <Button onClick={changePassword} disabled={busy || !cur || !nw || !conf} style={{ justifySelf: "start" }}>{busy ? "Updating…" : "Update Password"}</Button>
          {msg ? <p style={{ margin: 0, fontSize: 13, color: msg.ok ? "var(--green)" : "var(--red)" }}>{msg.text}</p> : null}
        </div>
      </Card>

      <Card>
        <SectionTitle>Two-Factor Authentication</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Status: <span style={{ color: "var(--orange)" }}>Not configured</span></span>
          <button className="btn-secondary" style={{ marginLeft: "auto" }} onClick={() => { setToast("2FA — Coming Soon"); setTimeout(() => setToast(null), 2000); }}>Set Up 2FA</button>
        </div>
      </Card>

      <Card>
        <SectionTitle action={<button className="btn-danger" onClick={revoke} style={{ fontSize: 12, padding: "5px 10px" }}>Revoke all other sessions</button>}>Active Sessions</SectionTitle>
        {sessionsLoading ? <SkeletonLoader rows={2} /> : sessions.length === 0 ? <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No login history recorded.</p> : (
          <div style={{ display: "grid", gap: 8 }}>
            {sessions.slice(0, 5).map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "8px 0", borderBottom: "1px solid #161616" }}>
                <ShieldCheck size={15} color={i === 0 ? PALETTE.green : "var(--text-muted)"} />
                <span className="mono">{s.ipAddress || "unknown IP"}</span>
                {i === 0 ? <span style={{ fontSize: 11, fontWeight: 600, color: PALETTE.green, background: "rgba(0,217,126,0.12)", border: "1px solid rgba(0,217,126,0.4)", borderRadius: 999, padding: "1px 8px" }}>Current session</span> : null}
                <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 12 }}>{relativeTime(s.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {toast ? <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "10px 16px", fontSize: 13, zIndex: 2000 }}>{toast}</div> : null}
    </div>
  );
}

function DetailsColumn({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [org, setOrg] = useState(profile.organization);
  const [saving, setSaving] = useState(false);
  useEffect(() => setOrg(profile.organization), [profile.organization]);
  const dirty = org.trim() !== profile.organization;
  const lastLoginHours = profile.lastLogin ? Math.round((Date.now() - new Date(profile.lastLogin).getTime()) / 3600000) : null;

  async function save() {
    setSaving(true);
    try { await api("/api/account/organization", { method: "PUT", body: JSON.stringify({ organization: org.trim() }) }); onSaved(); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <SectionTitle>Account Details</SectionTitle>
        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
            <span style={{ color: "var(--text-secondary)" }}>Organization name</span>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={org} onChange={(e) => setOrg(e.target.value)} style={{ flex: 1 }} />
              {dirty ? <Button onClick={save} disabled={saving}>{saving ? "…" : "Save"}</Button> : null}
            </div>
          </label>
          <Row label="Your role" value={profile.role} />
          <Row label="Account created" value={new Date(profile.createdAt).toLocaleDateString()} />
          <Row label="Projects owned" value={String(profile.projectsOwned)} />
          <Row label="Team members" value={String(profile.teamMembers)} />
          <Row label="Environments created" value={String(profile.environments)} />
        </div>
      </Card>

      <Card>
        <SectionTitle>Account Health</SectionTitle>
        <div style={{ display: "grid", gap: 10 }}>
          <Health color={PALETTE.green} label="Password strength" value="Strong" />
          <Health color={PALETTE.orange} label="Two-factor auth" value="Disabled" />
          <Health color={lastLoginHours !== null && lastLoginHours < 24 ? PALETTE.green : PALETTE.orange} label="Last login" value={lastLoginHours !== null ? `${lastLoginHours}h ago` : "—"} />
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", fontSize: 13 }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ marginLeft: "auto" }}>{value}</span>
    </div>
  );
}

function Health({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
      <span style={{ width: 9, height: 9, borderRadius: 999, background: color }} />
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ marginLeft: "auto", color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

function DangerZone() {
  const [exporting, setExporting] = useState(false);

  async function exportData() {
    setExporting(true);
    try {
      const data = await api<unknown>("/api/account/export", { method: "POST" });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `devcloud-account-export-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  }

  return (
    <Card style={{ border: "1px solid var(--red)" }}>
      <SectionTitle><span style={{ color: "var(--red)" }}>Danger Zone</span></SectionTitle>
      <div style={{ display: "grid", gap: 14 }}>
        <DangerRow title="Transfer Ownership" desc="Contact support to transfer ownership of this workspace.">
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Contact support</span>
        </DangerRow>
        <DangerRow title="Export All Data" desc="Download a JSON archive of your projects, tickets, and sessions.">
          <button className="btn-secondary" onClick={exportData} disabled={exporting} style={{ display: "flex", alignItems: "center", gap: 6 }}><Download size={14} /> {exporting ? "Exporting…" : "Export"}</button>
        </DangerRow>
        <DangerRow title="Delete Account" desc="Owner accounts cannot be deleted. Transfer ownership first.">
          <button className="btn-danger" disabled title="Owner accounts cannot be deleted. Transfer ownership first." style={{ opacity: 0.5, cursor: "not-allowed" }}>Delete Account</button>
        </DangerRow>
      </div>
    </Card>
  );
}

function DangerRow({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <strong style={{ fontSize: 14 }}>{title}</strong>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>{desc}</p>
      </div>
      {children}
    </div>
  );
}
