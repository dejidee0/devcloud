"use client";

import { ActivityFeed } from "@/components/ActivityFeed";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { StatusDot } from "@/components/StatusDot";
import { useApi } from "@/lib/use-api";

export default function DashboardPage() {
  const status = useApi<Record<string, unknown>>("/api/infrastructure/status");
  const deployments = useApi<unknown[]>("/api/deployments");
  const sessions = useApi<unknown[]>("/api/sessions");
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <h1>Dashboard</h1>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {status.loading ? <SkeletonLoader rows={3} /> : ["CPU", "RAM", "Disk"].map((label) => (
          <article key={label} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 14, background: "var(--bg-surface)" }}>
            <span style={{ color: "var(--text-secondary)" }}>{label}</span>
            <pre className="mono" style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{status.error ?? JSON.stringify(status.data, null, 2).slice(0, 180)}</pre>
          </article>
        ))}
      </section>
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
          <h2>Active sessions <StatusDot /></h2>
          {sessions.loading ? <SkeletonLoader rows={2} /> : <strong>{sessions.data?.length ?? 0}</strong>}
        </div>
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
          <h2>Recent deployments</h2>
          {deployments.loading ? <SkeletonLoader rows={3} /> : <pre className="mono">{JSON.stringify(deployments.data?.slice(0, 5), null, 2)}</pre>}
        </div>
      </section>
      <section style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
        <h2>Team activity</h2>
        <ActivityFeed />
      </section>
    </div>
  );
}
