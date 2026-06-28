"use client";

import { DeploymentPipeline } from "@/components/DeploymentPipeline";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useApi } from "@/lib/use-api";
import type { Deployment } from "@/types/models";

export default function DeploymentsPage() {
  const deployments = useApi<Deployment[]>("/api/deployments");
  return <div style={{ display: "grid", gap: 16 }}><h1>Deployments</h1>{deployments.loading ? <SkeletonLoader /> : deployments.error ? <p className="error-line">{deployments.error}</p> : <DeploymentPipeline deployments={deployments.data ?? []} />}</div>;
}
