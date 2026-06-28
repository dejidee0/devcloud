"use client";

import { SkeletonLoader } from "@/components/SkeletonLoader";
import { TechStackBadge } from "@/components/TechStackBadge";
import { useApi } from "@/lib/use-api";
import type { DevEnvironment } from "@/types/models";

export default function EnvironmentsPage() {
  const envs = useApi<DevEnvironment[]>("/api/environments");
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ marginRight: "auto" }}>Dev environments</h1>
        <select><option>DotNet</option><option>NodeJS</option><option>Python</option><option>Java</option></select>
        <button>Start</button>
      </header>
      {envs.loading ? <SkeletonLoader /> : envs.error ? <p className="error-line">{envs.error}</p> : (
        <div style={{ display: "grid", gap: 10 }}>{(envs.data ?? []).map((env) => (
          <article key={env.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 220px", alignItems: "center", gap: 12, border: "1px solid var(--border)", borderRadius: 8, padding: 12 }}>
            <span className="mono">{env.containerName}</span><TechStackBadge stack={env.techStack} />
            <div style={{ display: "flex", gap: 8 }}><button>Connect</button><button>Snapshot</button><button>Restore</button></div>
          </article>
        ))}</div>
      )}
    </div>
  );
}
