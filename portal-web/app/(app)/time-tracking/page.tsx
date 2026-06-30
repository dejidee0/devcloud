"use client";

import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, SectionTitle } from "@/components/ui";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useApi } from "@/lib/use-api";
import { PALETTE } from "@/lib/colors";

interface Row { developer: string; project: string; date: string; durationMinutes: number; }
interface Summary {
  weekHours: number; monthHours: number; mostActiveDeveloper?: string; mostActiveHours: number;
  rows: Row[]; perDeveloper: Array<{ developer: string; hours: number }>;
}

function fmtH(min: number) { return `${(min / 60).toFixed(1)}h`; }

export default function TimeTrackingPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const path = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", new Date(from).toISOString());
    if (to) p.set("to", new Date(to + "T23:59:59").toISOString());
    return `/api/time-tracking/summary${p.toString() ? `?${p}` : ""}`;
  }, [from, to]);
  const data = useApi<Summary>(path);

  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of data.data?.rows ?? []) {
      const day = new Date(r.date).toLocaleDateString();
      (map.get(day) ?? map.set(day, []).get(day)!).push(r);
    }
    return Array.from(map.entries());
  }, [data.data]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Clock color={PALETTE.gold} />
        <h1 style={{ marginRight: "auto" }}>Time Tracking</h1>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From" />
        <span style={{ color: "var(--text-muted)" }}>→</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To" />
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <Stat label="Hours this week" value={data.data ? `${data.data.weekHours}h` : "—"} color={PALETTE.gold} />
        <Stat label="Hours this month" value={data.data ? `${data.data.monthHours}h` : "—"} color={PALETTE.blue} />
        <Stat label="Most active developer" value={data.data?.mostActiveDeveloper ?? "—"} sub={data.data?.mostActiveDeveloper ? `${data.data.mostActiveHours}h` : ""} color={PALETTE.green} />
      </section>

      <Card>
        <SectionTitle>Hours per developer</SectionTitle>
        {data.loading ? <SkeletonLoader rows={4} /> : (data.data?.perDeveloper.length ?? 0) === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No sessions recorded yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.data?.perDeveloper ?? []}>
              <CartesianGrid stroke="#1f1f1f" />
              <XAxis dataKey="developer" stroke="#333" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis stroke="#333" tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="hours" fill={PALETTE.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card>
        <SectionTitle>Sessions by day</SectionTitle>
        {data.loading ? <SkeletonLoader rows={4} /> : grouped.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No time logged yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {grouped.map(([day, rows]) => (
              <div key={day}>
                <div style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600, marginBottom: 6 }}>{day}</div>
                <div style={{ overflow: "auto" }}>
                  <table className="responsive-table">
                    <thead><tr><th>Developer</th><th>Project</th><th>Duration</th></tr></thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i}>
                          <td data-label="Developer">{r.developer}</td>
                          <td data-label="Project" style={{ color: "var(--text-secondary)" }}>{r.project}</td>
                          <td data-label="Duration" className="mono">{fmtH(r.durationMinutes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <Card style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
      <strong style={{ fontSize: 24, fontWeight: 700, color }}>{value}</strong>
      {sub ? <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</span> : null}
    </Card>
  );
}
