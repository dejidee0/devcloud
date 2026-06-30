"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Boxes, Cpu, FileText, Lock, Plus, Rocket, Shield, Sparkles, Users } from "lucide-react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Avatar, Card, ProgressBar, PulseDot, SectionTitle, SeverityBadge } from "@/components/ui";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { TechStackBadge } from "@/components/TechStackBadge";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { usePoll } from "@/lib/use-poll";
import type { Deployment, Project, User } from "@/types/models";

interface ServerStats {
  cpu: { percent: number };
  ram: { usedMb: number; totalMb: number };
  disk: { usedGb: number; totalGb: number };
  checkedAt: string;
}
interface LiveContainers { containers: Array<{ name: string; image: string; status: string; state: string }>; }
interface SecurityScan { id: string; status: string; riskScore: number; highestSeverity: string; findingsCount: number; createdAt: string; }

const cardLift = { onMouseEnter: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.transform = "translateY(-2px)"), onMouseLeave: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.transform = "translateY(0)") };

export default function DashboardPage() {
  const stats = usePoll<ServerStats>("/api/infrastructure/stats", 30000);
  const live = usePoll<LiveContainers>("/api/environments/live", 30000);
  const deployments = useApi<Deployment[]>("/api/deployments");
  const projects = useApi<Project[]>("/api/projects");
  const users = useApi<User[]>("/api/users");
  const scans = useApi<SecurityScan[]>("/api/ai/security-scans");

  // Track CPU history for the sparkline.
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const lastCpu = useRef<number | null>(null);
  useEffect(() => {
    const pct = stats.data?.cpu.percent;
    if (typeof pct === "number" && pct !== lastCpu.current) {
      lastCpu.current = pct;
      setCpuHistory((prev) => [...prev, pct].slice(-20));
    }
  }, [stats.data]);

  const runningCount = live.data?.containers.filter((c) => c.state?.toLowerCase() === "running").length
    ?? live.data?.containers.length ?? null;
  const now = new Date();
  const thisMonthDeploys = (deployments.data ?? []).filter((d) => {
    const dt = new Date(d.startedAt);
    return dt.getUTCMonth() === now.getUTCMonth() && dt.getUTCFullYear() === now.getUTCFullYear();
  }).length;
  const lastScan = scans.data?.[0];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Dashboard</h1>
        <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Live operations overview</span>
        <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 12 }}>
          {stats.data ? `Server checked ${new Date(stats.data.checkedAt).toLocaleTimeString()}` : ""}
        </span>
      </header>

      {/* TOP ROW — 4 stat cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <Card style={{ display: "grid", gap: 8 }} {...cardLift}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 13 }}>
            <Boxes size={16} /> Active Environments {runningCount !== null ? <PulseDot /> : null}
          </div>
          <strong style={{ fontSize: 30, fontWeight: 700 }}>{runningCount ?? (live.loading ? "—" : "0")}</strong>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{live.error ? "SSH not configured" : "running containers"}</span>
        </Card>

        <Card style={{ display: "grid", gap: 8 }} {...cardLift}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 13 }}>
            <Cpu size={16} /> CPU Usage
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <strong style={{ fontSize: 30, fontWeight: 700 }}>{stats.data ? `${stats.data.cpu.percent}%` : (stats.loading ? "—" : "n/a")}</strong>
            <Sparkline points={cpuHistory} />
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{stats.error ? "stats unavailable" : "Hetzner host"}</span>
        </Card>

        <Card style={{ display: "grid", gap: 8 }} {...cardLift}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 13 }}>
            <Users size={16} /> Team Online
          </div>
          <div style={{ display: "flex", alignItems: "center", minHeight: 36 }}>
            {(users.data ?? []).filter((u) => u.isActive).slice(0, 6).map((u, i) => <Avatar key={u.id} name={u.fullName} index={i} />)}
            {users.data && users.data.length === 0 ? <span style={{ color: "var(--text-muted)", fontSize: 13 }}>No users</span> : null}
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{users.data?.filter((u) => u.isActive).length ?? 0} active members</span>
        </Card>

        <Card style={{ display: "grid", gap: 8 }} {...cardLift}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 13 }}>
            <Rocket size={16} /> This Month
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <strong style={{ fontSize: 30, fontWeight: 700 }}>{deployments.loading ? "—" : thisMonthDeploys}</strong>
            <ArrowUpRight size={20} color="var(--brand)" />
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>deployments</span>
        </Card>
      </section>

      {/* MIDDLE — two columns */}
      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 6fr) minmax(0, 4fr)", gap: 16 }}>
        <div style={{ display: "grid", gap: 16 }}>
          <Card>
            <SectionTitle action={<PulseDot />}>Live Activity</SectionTitle>
            <ActivityFeed limit={10} />
          </Card>

          <Card>
            <SectionTitle>Recent Deployments</SectionTitle>
            {deployments.loading ? <SkeletonLoader rows={3} /> : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: 13 }}>
                  <thead><tr><th>Env</th><th>Status</th><th>Commit</th><th>When</th><th></th></tr></thead>
                  <tbody>
                    {(deployments.data ?? []).slice(0, 6).map((d) => (
                      <tr key={d.id}>
                        <td>{d.environment}</td>
                        <td><DeployBadge status={d.status} /></td>
                        <td className="mono" style={{ color: "var(--text-secondary)" }}>{d.commitHash?.slice(0, 7) ?? "—"}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{new Date(d.startedAt).toLocaleDateString()}</td>
                        <td><button style={{ fontSize: 12, padding: "4px 8px" }} onClick={() => api(`/api/deployments/${d.id}/rollback`, { method: "POST" }).catch(() => undefined)}>Rollback</button></td>
                      </tr>
                    ))}
                    {(deployments.data ?? []).length === 0 ? <tr><td colSpan={5} style={{ color: "var(--text-muted)" }}>No deployments yet</td></tr> : null}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <Card>
            <SectionTitle>Server Health</SectionTitle>
            {stats.loading ? <SkeletonLoader rows={3} /> : stats.error ? (
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>{stats.error.includes("503") || stats.error.toLowerCase().includes("config") ? "SSH key not configured on server." : stats.error}</p>
            ) : stats.data ? (
              <div style={{ display: "grid", gap: 14 }}>
                <HealthBar label="CPU" value={stats.data.cpu.percent} display={`${stats.data.cpu.percent}%`} />
                <HealthBar label="RAM" value={(stats.data.ram.usedMb / Math.max(stats.data.ram.totalMb, 1)) * 100} display={`${(stats.data.ram.usedMb / 1024).toFixed(1)} / ${(stats.data.ram.totalMb / 1024).toFixed(1)} GB`} />
                <HealthBar label="Disk" value={(stats.data.disk.usedGb / Math.max(stats.data.disk.totalGb, 1)) * 100} display={`${stats.data.disk.usedGb} / ${stats.data.disk.totalGb} GB`} />
              </div>
            ) : null}
          </Card>

          <Card>
            <SectionTitle action={<Sparkles size={15} color="#b66bff" />}>AI Insights</SectionTitle>
            <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Shield size={15} color="var(--text-secondary)" />
                <span style={{ color: "var(--text-secondary)" }}>Last security scan:</span>
                {lastScan ? <SeverityBadge severity={lastScan.highestSeverity} /> : <span style={{ color: "var(--text-muted)" }}>none yet</span>}
                {lastScan ? <span style={{ marginLeft: "auto", color: "var(--text-muted)" }}>risk {lastScan.riskScore}</span> : null}
              </div>
              <div style={{ color: "var(--text-secondary)" }}>
                {lastScan ? `${lastScan.findingsCount} findings on the latest scan.` : "Run an AI security scan to see insights."}
              </div>
              <Link href="/ai/security" style={{ color: "var(--brand)", fontSize: 12 }}>Open AI Security →</Link>
            </div>
          </Card>

          <Card>
            <SectionTitle>Quick Actions</SectionTitle>
            <div style={{ display: "grid", gap: 8 }}>
              <button onClick={() => api("/api/infrastructure/lockdown", { method: "POST" }).then(() => alert("Infrastructure lockdown triggered.")).catch((e) => alert(e.message))} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-start" }}><Lock size={15} /> Lock Infrastructure</button>
              <Link href="/environments"><button style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-start", width: "100%" }}><Plus size={15} /> New Environment</button></Link>
              <Link href="/ai/reports"><button style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-start", width: "100%" }}><FileText size={15} /> Generate Report</button></Link>
            </div>
          </Card>
        </div>
      </section>

      {/* BOTTOM — projects overview */}
      <section>
        <SectionTitle>Projects Overview</SectionTitle>
        {projects.loading ? <SkeletonLoader rows={2} /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {(projects.data ?? []).map((p) => (
              <Card key={p.id} {...cardLift}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: 15 }}>{p.name}</strong>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: p.status === "Active" ? "var(--brand)" : "var(--text-secondary)" }}>{p.status}</span>
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: 12, margin: "4px 0 10px" }}>{p.clientName}</div>
                <TechStackBadge stack={p.techStack} />
                <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-muted)" }}>Created {new Date(p.createdAt).toLocaleDateString()}</div>
              </Card>
            ))}
            {(projects.data ?? []).length === 0 ? <p style={{ color: "var(--text-muted)" }}>No projects yet.</p> : null}
          </div>
        )}
      </section>
    </div>
  );
}

function HealthBar({ label, value, display }: { label: string; value: number; display: string }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", fontSize: 12, color: "var(--text-secondary)" }}>
        <span>{label}</span>
        <span style={{ marginLeft: "auto", color: "var(--text-primary)" }}>{display}</span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}

function DeployBadge({ status }: { status: string }) {
  const color = status === "Success" ? "var(--brand)" : status === "Failed" ? "var(--danger)" : status === "Running" ? "#3b9eff" : "var(--warning)";
  return <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}1a`, padding: "2px 8px", borderRadius: 999 }}>{status}</span>;
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return <span style={{ fontSize: 11, color: "var(--text-muted)" }}>collecting…</span>;
  const w = 80, h = 28, max = Math.max(...points, 1), min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);
  const coords = points.map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={coords} fill="none" stroke="var(--brand)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
