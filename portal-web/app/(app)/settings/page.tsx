"use client";

import { useApi } from "@/lib/use-api";
import { SkeletonLoader } from "@/components/SkeletonLoader";

export default function SettingsPage() {
  const status = useApi<Record<string, unknown>>("/api/infrastructure/status");
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1>System settings</h1>
      <section style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
        <h2>Server info</h2>
        {status.loading ? <SkeletonLoader rows={4} /> : <pre className="mono">{JSON.stringify(status.data ?? status.error, null, 2)}</pre>}
      </section>
      <section style={{ border: "1px solid var(--danger)", borderRadius: 8, padding: 14 }}>
        <h2>Danger zone</h2>
        <button style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>Lockdown</button>
        <button style={{ marginLeft: 8, borderColor: "var(--danger)", color: "var(--danger)" }}>Nuclear option</button>
      </section>
    </div>
  );
}
