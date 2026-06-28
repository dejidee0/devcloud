"use client";

import { DataTable } from "@/components/DataTable";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useApi } from "@/lib/use-api";

export default function AuditPage() {
  const logs = useApi<Record<string, unknown>[]>("/api/infrastructure/audit-logs");
  return <div style={{ display: "grid", gap: 16 }}><header style={{ display: "flex" }}><h1 style={{ marginRight: "auto" }}>Audit logs</h1><button>Export CSV</button></header>{logs.loading ? <SkeletonLoader /> : logs.error ? <p className="error-line">{logs.error}</p> : <DataTable rows={logs.data ?? []} columns={[{ key: "userId", label: "User" }, { key: "action", label: "Action" }, { key: "resource", label: "Resource" }, { key: "ipAddress", label: "IP" }, { key: "createdAt", label: "Timestamp" }]} />}</div>;
}
