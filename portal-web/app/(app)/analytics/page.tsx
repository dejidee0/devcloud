"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BarChart3 } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { Card, SectionTitle } from "@/components/ui";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useApi } from "@/lib/use-api";
import { relativeTime } from "@/lib/session";

interface Analytics {
  window: number;
  summary: { activeEnvironments: number; deployments: number; hoursLogged: number; aiCalls: number };
  teamActivity: Array<{ date: string; count: number }>;
  envByStack: Array<{ stack: string; count: number }>;
  deploymentSuccess: { success: number; total: number; rate: number };
  sessionTrends: Array<{ week: string; hours: number }>;
  resourceHistory: Array<{ at: string; cpu: number; ram: number; disk: number }>;
  ticketsVelocity: Array<{ week: string; created: number; closed: number }>;
  aiUsage: Array<{ feature: string; count: number }>;
}
interface NetCheck { at: string; status: string; ip: string; }

const GOLD = "#caa24a", GREEN = "#00D97E", BLUE = "#3b9eff", PURPLE = "#b66bff", RED = "#FF3B30";
const STACK_COLORS = [GREEN, BLUE, PURPLE, GOLD, "#ff6b9e", "#2dd4bf", "#f5a623"];
const axis = { stroke: "#333", fontSize: 11, tick: { fill: "#888" } };
const tooltipStyle = { background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12, color: "#ededed" };

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const data = useApi<Analytics>(`/api/analytics/overview?days=${days}`);
  const net = useApi<NetCheck[]>("/api/infrastructure/network-history");

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <BarChart3 color={GOLD} />
        <h1 style={{ margin: 0, fontSize: 22 }}>Analytics</h1>
        <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Real-time operational insights</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} style={{ padding: "6px 12px", fontSize: 13, background: days === d ? "var(--brand-dim)" : "transparent", border: `1px solid ${days === d ? "var(--brand)" : "var(--border-strong)"}`, color: days === d ? "var(--brand)" : "var(--text-secondary)" }}>{d}d</button>
          ))}
        </div>
      </header>

      <Globe />

      {/* Summary stat cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <Stat label="Active Environments" value={data.data?.summary.activeEnvironments} color={GREEN} />
        <Stat label="Deployments" value={data.data?.summary.deployments} color={BLUE} />
        <Stat label={`Hours Logged (${days}d)`} value={data.data?.summary.hoursLogged} color={GOLD} />
        <Stat label={`AI Calls (${days}d)`} value={data.data?.summary.aiCalls} color={PURPLE} />
      </section>

      {/* Chart grid */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 16 }}>
        <Reveal><ChartCard title="Team Activity Over Time">
          {data.loading ? <SkeletonLoader rows={4} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.data?.teamActivity ?? []}>
                <defs><linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={GOLD} stopOpacity={0.5} /><stop offset="100%" stopColor={GOLD} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="#1f1f1f" />
                <XAxis dataKey="date" {...axis} tickFormatter={(v: string) => v.slice(5)} minTickGap={24} />
                <YAxis {...axis} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="count" stroke={GOLD} fill="url(#goldFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard></Reveal>

        <Reveal><ChartCard title="Environment Usage by Stack">
          {data.loading ? <SkeletonLoader rows={4} /> : (data.data?.envByStack.length ?? 0) === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.data?.envByStack ?? []} dataKey="count" nameKey="stack" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {(data.data?.envByStack ?? []).map((_, i) => <Cell key={i} fill={STACK_COLORS[i % STACK_COLORS.length]} stroke="#0f0f0f" />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard></Reveal>

        <Reveal><ChartCard title="Deployment Success Rate">
          {data.loading ? <SkeletonLoader rows={4} /> : (
            <div style={{ position: "relative" }}>
              <ResponsiveContainer width="100%" height={240}>
                <RadialBarChart innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270} data={[{ name: "rate", value: data.data?.deploymentSuccess.rate ?? 0, fill: GREEN }]}>
                  <RadialBar background={{ fill: "#1a1a1a" }} dataKey="value" cornerRadius={8} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 38, fontWeight: 700, color: GREEN }}>{data.data?.deploymentSuccess.rate ?? 0}%</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{data.data?.deploymentSuccess.success ?? 0}/{data.data?.deploymentSuccess.total ?? 0} successful</div>
                </div>
              </div>
            </div>
          )}
        </ChartCard></Reveal>

        <Reveal><ChartCard title="Session Duration Trends">
          {data.loading ? <SkeletonLoader rows={4} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.data?.sessionTrends ?? []}>
                <CartesianGrid stroke="#1f1f1f" />
                <XAxis dataKey="week" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="hours" stroke={BLUE} strokeWidth={2} dot={{ r: 3, fill: BLUE }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard></Reveal>

        <Reveal><ChartCard title="Server Resource History (24h)">
          {data.loading ? <SkeletonLoader rows={4} /> : (data.data?.resourceHistory.length ?? 0) === 0 ? <Empty note="Snapshots are captured every 30 min." /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.data?.resourceHistory ?? []}>
                <CartesianGrid stroke="#1f1f1f" />
                <XAxis dataKey="at" {...axis} tickFormatter={(v: string) => new Date(v).getHours() + "h"} minTickGap={24} />
                <YAxis {...axis} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => new Date(v as string).toLocaleString()} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="cpu" stroke={GREEN} dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="ram" stroke={BLUE} dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="disk" stroke={GOLD} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard></Reveal>

        <Reveal><ChartCard title="Tickets Velocity (8 weeks)">
          {data.loading ? <SkeletonLoader rows={4} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.data?.ticketsVelocity ?? []}>
                <CartesianGrid stroke="#1f1f1f" />
                <XAxis dataKey="week" {...axis} />
                <YAxis {...axis} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="created" fill={BLUE} radius={[3, 3, 0, 0]} />
                <Bar dataKey="closed" fill={GREEN} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard></Reveal>

        <Reveal><ChartCard title="AI Usage Breakdown">
          {data.loading ? <SkeletonLoader rows={4} /> : (data.data?.aiUsage.length ?? 0) === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.data?.aiUsage ?? []} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#1f1f1f" horizontal={false} />
                <XAxis type="number" {...axis} allowDecimals={false} />
                <YAxis type="category" dataKey="feature" {...axis} width={90} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={PURPLE} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard></Reveal>

        <Reveal><ChartCard title="Network Verification History">
          {net.loading ? <SkeletonLoader rows={4} /> : (net.data?.length ?? 0) === 0 ? <Empty note="Checks appear here as the dashboard verifies the network." /> : (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {(net.data ?? []).slice().reverse().map((c, i) => (
                  <span key={i} title={`${c.status} · ${new Date(c.at).toLocaleString()}`} style={{ width: 14, height: 28, borderRadius: 3, background: c.status === "Verified Clean" ? GREEN : c.status === "Review Needed" ? GOLD : "#555" }} />
                ))}
              </div>
              <div style={{ display: "grid", gap: 4, maxHeight: 150, overflowY: "auto" }}>
                {(net.data ?? []).map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: c.status === "Verified Clean" ? GREEN : c.status === "Review Needed" ? GOLD : "#555" }} />
                    <span>{c.status}</span>
                    <span style={{ marginLeft: "auto", color: "var(--text-muted)" }}>{relativeTime(c.at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard></Reveal>
      </section>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value?: number; color: string }) {
  return (
    <Card style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
      <strong style={{ fontSize: 28, fontWeight: 700, color }}>{value ?? "—"}</strong>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return <Card><SectionTitle>{title}</SectionTitle>{children}</Card>;
}

function Empty({ note }: { note?: string }) {
  return <div style={{ height: 200, display: "grid", placeItems: "center", color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>No data yet{note ? <br /> : null}{note ? <span style={{ fontSize: 11 }}>{note}</span> : null}</div>;
}

/** Scroll-triggered fade/slide-in. */
function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: shown ? 1 : 0, transform: shown ? "translateY(0)" : "translateY(16px)", transition: "opacity 500ms ease, transform 500ms cubic-bezier(0.16,1,0.3,1)" }}>
      {children}
    </div>
  );
}

/** CSS-only rotating globe with a pulsing server dot and an animated connection arc. */
function Globe() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "6px 0 2px" }}>
      <div style={{ position: "relative", width: 170, height: 170 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, #123a2e, #0a1622 60%, #060a10)",
          boxShadow: "inset -12px -12px 30px rgba(0,0,0,0.7), 0 0 40px rgba(0,217,126,0.18)",
          overflow: "hidden", border: "1px solid #1f2c3f"
        }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "repeating-linear-gradient(90deg, transparent 0 18px, rgba(0,217,126,0.10) 18px 19px)", animation: "dc-spin 12s linear infinite" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "repeating-linear-gradient(0deg, transparent 0 22px, rgba(59,158,255,0.08) 22px 23px)" }} />
        </div>
        {/* pulsing server dot (approx Europe) */}
        <span style={{ position: "absolute", top: 58, left: 96, width: 10, height: 10 }}>
          <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: GREEN, opacity: 0.6, animation: "dc-ping 1.8s cubic-bezier(0,0,0.2,1) infinite" }} />
          <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: GREEN, width: 10, height: 10 }} />
        </span>
        {/* animated connection arc */}
        <svg style={{ position: "absolute", inset: 0, width: 170, height: 170, pointerEvents: "none" }} viewBox="0 0 170 170">
          <path d="M101 63 C 130 30, 150 70, 120 110" fill="none" stroke={GREEN} strokeWidth={1.4} strokeDasharray="4 6" opacity={0.7}>
            <animate attributeName="stroke-dashoffset" values="20;0" dur="1.2s" repeatCount="indefinite" />
          </path>
          <circle r={2.4} fill={BLUE}>
            <animateMotion dur="2.6s" repeatCount="indefinite" path="M101 63 C 130 30, 150 70, 120 110" />
          </circle>
        </svg>
        <style>{"@keyframes dc-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes dc-ping{75%,100%{transform:scale(2.4);opacity:0}}"}</style>
      </div>
    </div>
  );
}
