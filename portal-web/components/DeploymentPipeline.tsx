import type { Deployment } from "@/types/models";
import { StatusDot } from "@/components/StatusDot";

export function DeploymentPipeline({ deployments }: { deployments: Deployment[] }) {
  return <div style={{ display: "grid", gap: 10 }}>{deployments.map((d) => (
    <article key={d.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr 120px", gap: 12, alignItems: "center", border: "1px solid var(--border)", borderRadius: 8, padding: 12 }}>
      <span>{d.environment}</span>
      <code className="mono">{d.commitHash ?? "pending commit"}</code>
      <span><StatusDot status={d.status === "Failed" ? "danger" : d.status === "Success" ? "ok" : "warn"} /> {d.status}</span>
    </article>
  ))}</div>;
}
