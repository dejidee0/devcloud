"use client";

import { KanbanBoard } from "@/components/KanbanBoard";
import { DeploymentPipeline } from "@/components/DeploymentPipeline";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useApi } from "@/lib/use-api";
import type { Deployment, DevEnvironment, Project, Ticket } from "@/types/models";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = useApi<Project>(`/api/projects/${params.id}`);
  const tickets = useApi<Ticket[]>(`/api/tickets?projectId=${params.id}`);
  const deployments = useApi<Deployment[]>(`/api/deployments?projectId=${params.id}`);
  const envs = useApi<DevEnvironment[]>("/api/environments");
  if (project.loading) return <SkeletonLoader rows={6} />;
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <h1>{project.data?.name}</h1>
      <p style={{ color: "var(--text-secondary)" }}>{project.data?.description}</p>
      <section><h2>Tickets</h2>{tickets.loading ? <SkeletonLoader /> : <KanbanBoard tickets={tickets.data ?? []} />}</section>
      <section><h2>Deployments</h2>{deployments.loading ? <SkeletonLoader /> : <DeploymentPipeline deployments={deployments.data ?? []} />}</section>
      <section><h2>Environments</h2><pre className="mono">{JSON.stringify((envs.data ?? []).filter((e) => e.projectId === params.id), null, 2)}</pre></section>
      <section><h2>Settings</h2><pre className="mono">{JSON.stringify(project.data, null, 2)}</pre></section>
    </div>
  );
}
