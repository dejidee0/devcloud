"use client";

import { DataTable } from "@/components/DataTable";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useApi } from "@/lib/use-api";

export default function TimeTrackingPage() {
  const summary = useApi<Record<string, unknown>[]>("/api/sessions/summary");
  return <div style={{ display: "grid", gap: 16 }}><header style={{ display: "flex", gap: 12 }}><h1 style={{ marginRight: "auto" }}>Time tracking</h1><input type="date" /><input type="date" /><button>Export PDF</button></header>{summary.loading ? <SkeletonLoader /> : summary.error ? <p className="error-line">{summary.error}</p> : <DataTable rows={summary.data ?? []} columns={[{ key: "userId", label: "Developer" }, { key: "projectId", label: "Project" }, { key: "hours", label: "Hours" }]} />}</div>;
}
