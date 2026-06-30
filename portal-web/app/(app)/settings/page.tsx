"use client";

import { useEffect, useState } from "react";
import { Check, Cpu, ExternalLink, HardDrive, MemoryStick, Network, Settings as SettingsIcon, ShieldAlert } from "lucide-react";
import { Button, Card, ProgressBar, SectionTitle } from "@/components/ui";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { currentUser } from "@/lib/session";
import { PALETTE } from "@/lib/colors";

interface ServerStats { cpu: { percent: number }; ram: { usedMb: number; totalMb: number }; disk: { usedGb: number; totalGb: number }; }

const ROLES = ["Owner", "CoFounder", "Developer", "ProductManager", "Client"];
const CAPABILITIES: Array<{ name: string; allowed: string[] }> = [
  { name: "Manage infrastructure", allowed: ["Owner"] },
  { name: "Create users / invite", allowed: ["Owner"] },
  { name: "Manage projects", allowed: ["Owner", "CoFounder"] },
  { name: "Trigger deployments", allowed: ["Owner", "CoFounder"] },
  { name: "Use AI tools", allowed: ["Owner", "CoFounder"] },
  { name: "Manage tickets", allowed: ["Owner", "CoFounder", "ProductManager"] },
  { name: "View dashboards", allowed: ["Owner", "CoFounder", "Developer", "ProductManager", "Client"] }
];
const TZ = ["UTC", "Africa/Lagos", "Europe/Berlin", "Europe/London", "America/New_York", "Asia/Singapore"];

export default function SettingsPage() {
  const stats = useApi<ServerStats>("/api/infrastructure/stats");
  const isOwner = currentUser()?.role === "Owner";

  const [org, setOrg] = useState("DevCloud");
  const [tz, setTz] = useState("UTC");
  const [savedGeneral, setSavedGeneral] = useState(false);

  useEffect(() => {
    setOrg(localStorage.getItem("devcloud_org_name") || "DevCloud");
    setTz(localStorage.getItem("devcloud_timezone") || "UTC");
  }, []);

  function saveGeneral() {
    localStorage.setItem("devcloud_org_name", org);
    localStorage.setItem("devcloud_timezone", tz);
    setSavedGeneral(true);
    setTimeout(() => setSavedGeneral(false), 1600);
  }

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 920 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SettingsIcon color={PALETTE.indigo} />
        <h1 style={{ margin: 0 }}>Settings</h1>
      </header>

      {/* General */}
      <Card>
        <SectionTitle>General</SectionTitle>
        <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
          <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
            <span style={{ color: "var(--text-secondary)" }}>Organization name</span>
            <input value={org} onChange={(e) => setOrg(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
            <span style={{ color: "var(--text-secondary)" }}>Timezone</span>
            <select value={tz} onChange={(e) => setTz(e.target.value)}>{TZ.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          </label>
          <Button onClick={saveGeneral} style={{ justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 6 }}>{savedGeneral ? <><Check size={15} /> Saved</> : "Save changes"}</Button>
        </div>
      </Card>

      {/* Team roles */}
      <Card>
        <SectionTitle>Team Roles</SectionTitle>
        <div style={{ overflow: "auto" }}>
          <table style={{ fontSize: 13 }}>
            <thead><tr><th>Capability</th>{ROLES.map((r) => <th key={r} style={{ textAlign: "center" }}>{r}</th>)}</tr></thead>
            <tbody>
              {CAPABILITIES.map((c) => (
                <tr key={c.name}>
                  <td>{c.name}</td>
                  {ROLES.map((r) => (
                    <td key={r} style={{ textAlign: "center" }}>
                      {c.allowed.includes(r) ? <Check size={15} color={PALETTE.green} /> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Infrastructure */}
      <Card>
        <SectionTitle>Infrastructure</SectionTitle>
        {stats.loading ? <SkeletonLoader rows={3} /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <InfraStat icon={<Cpu size={16} />} label="CPU" value={stats.data ? `${stats.data.cpu.percent}%` : "n/a"} pct={stats.data?.cpu.percent ?? 0} />
            <InfraStat icon={<MemoryStick size={16} />} label="RAM" value={stats.data ? `${(stats.data.ram.usedMb / 1024).toFixed(1)} / ${(stats.data.ram.totalMb / 1024).toFixed(1)} GB` : "n/a"} pct={stats.data ? (stats.data.ram.usedMb / Math.max(stats.data.ram.totalMb, 1)) * 100 : 0} />
            <InfraStat icon={<HardDrive size={16} />} label="Disk" value={stats.data ? `${stats.data.disk.usedGb} / ${stats.data.disk.totalGb} GB` : "n/a"} pct={stats.data ? (stats.data.disk.usedGb / Math.max(stats.data.disk.totalGb, 1)) * 100 : 0} />
            <Card style={{ background: "var(--bg-elevated)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}><Network size={16} color={PALETTE.cyan} /> Tailscale</div>
              <div style={{ marginTop: 6, fontSize: 13 }}><span style={{ color: PALETTE.green }}>● Connected</span> <span className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>100.105.66.71</span></div>
            </Card>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <a href="https://codemonk-devcloud-01:3080" target="_blank" rel="noreferrer noopener"><button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}><ExternalLink size={14} /> Open Teleport</button></a>
          <a href="http://100.105.66.71:8080" target="_blank" rel="noreferrer noopener"><button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}><ExternalLink size={14} /> Open Infisical</button></a>
        </div>
      </Card>

      {/* Danger zone */}
      {isOwner ? <DangerZone /> : null}
    </div>
  );
}

function InfraStat({ icon, label, value, pct }: { icon: React.ReactNode; label: string; value: string; pct: number }) {
  return (
    <Card style={{ background: "var(--bg-elevated)", display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>{icon} {label}</div>
      <strong style={{ fontSize: 16 }}>{value}</strong>
      <ProgressBar value={pct} />
    </Card>
  );
}

function DangerZone() {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function lockdown() {
    setBusy(true); setMsg(null);
    try { await api("/api/infrastructure/lockdown", { method: "POST" }); setMsg("Infrastructure lockdown triggered."); setConfirm(""); }
    catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return (
    <Card style={{ border: "1px solid var(--red)" }}>
      <SectionTitle><span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--red)" }}><ShieldAlert size={16} /> Danger Zone</span></SectionTitle>
      <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 0 }}>Locking infrastructure suspends developer access to the server. Type <span className="mono" style={{ color: "var(--red)" }}>LOCKDOWN</span> to confirm.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type LOCKDOWN" style={{ maxWidth: 200 }} />
        <button className="btn-danger" onClick={lockdown} disabled={busy || confirm !== "LOCKDOWN"}>{busy ? "Locking…" : "Lock Infrastructure"}</button>
      </div>
      {msg ? <p style={{ marginTop: 10, fontSize: 13, color: msg.includes("triggered") ? "var(--green)" : "var(--red)" }}>{msg}</p> : null}
    </Card>
  );
}
