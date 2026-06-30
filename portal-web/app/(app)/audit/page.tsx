"use client";

import { useMemo, useState } from "react";
import { Download, Shield } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useApi } from "@/lib/use-api";
import { relativeTime } from "@/lib/session";
import { PALETTE } from "@/lib/colors";
import type { User } from "@/types/models";

interface AuditRow { id: string; userId?: string | null; userName?: string | null; action: string; resource: string; details?: string | null; ipAddress?: string | null; createdAt: string; }
interface AuditResponse { items: AuditRow[]; total: number; actions: string[]; }

export default function AuditPage() {
  const users = useApi<User[]>("/api/users");
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const path = useMemo(() => {
    const p = new URLSearchParams();
    if (userId) p.set("userId", userId);
    if (action) p.set("action", action);
    if (from) p.set("from", new Date(from).toISOString());
    if (to) p.set("to", new Date(to + "T23:59:59").toISOString());
    p.set("pageSize", "300");
    return `/api/audit-logs?${p.toString()}`;
  }, [userId, action, from, to]);

  const data = useApi<AuditResponse>(path);
  const rows = data.data?.items ?? [];

  function exportCsv() {
    const header = ["User", "Action", "Resource", "IP Address", "Timestamp", "Details"];
    const lines = rows.map((r) => [
      r.userName ?? r.userId ?? "system", r.action, r.resource, r.ipAddress ?? "", r.createdAt, (r.details ?? "").replace(/\s+/g, " ")
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `devcloud-audit-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Shield color={PALETTE.gold} />
        <h1 style={{ marginRight: "auto" }}>Audit Logs</h1>
        <button className="btn-secondary" onClick={exportCsv} disabled={rows.length === 0} style={{ display: "flex", alignItems: "center", gap: 6 }}><Download size={15} /> Export CSV</button>
      </header>

      <Card>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} title="User">
            <option value="">All users</option>
            {(users.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
          <select value={action} onChange={(e) => setAction(e.target.value)} title="Action">
            <option value="">All actions</option>
            {(data.data?.actions ?? []).map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From" />
          <span style={{ color: "var(--text-muted)" }}>→</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To" />
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>{data.data?.total ?? 0} events</span>
        </div>
      </Card>

      {data.loading ? <SkeletonLoader /> : data.error ? <p className="error-line">{data.error}</p> : rows.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>No audit activity recorded yet</Card>
      ) : (
        <div style={{ overflow: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
          <table className="responsive-table">
            <thead><tr><th>User</th><th>Action</th><th>Resource</th><th>IP Address</th><th>Timestamp</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <RowItem key={r.id} row={r} expanded={expanded === r.id} onToggle={() => setExpanded(expanded === r.id ? null : r.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RowItem({ row, expanded, onToggle }: { row: AuditRow; expanded: boolean; onToggle: () => void }) {
  let pretty: string | null = null;
  if (row.details) {
    try { pretty = JSON.stringify(JSON.parse(row.details), null, 2); } catch { pretty = row.details; }
  }
  return (
    <>
      <tr onClick={onToggle} style={{ cursor: "pointer" }}>
        <td data-label="User">{row.userName ?? <span style={{ color: "var(--text-muted)" }}>system</span>}</td>
        <td data-label="Action"><span style={{ color: "var(--gold)" }}>{row.action}</span></td>
        <td data-label="Resource" style={{ color: "var(--text-secondary)" }}>{row.resource}</td>
        <td data-label="IP Address" className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>{row.ipAddress ?? "—"}</td>
        <td data-label="Timestamp" style={{ color: "var(--text-secondary)" }}>{relativeTime(row.createdAt)}</td>
      </tr>
      {expanded ? (
        <tr>
          <td colSpan={5} style={{ background: "var(--bg-base)" }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>{new Date(row.createdAt).toLocaleString()}</div>
            <pre className="mono" style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap", color: "var(--text-primary)" }}>{pretty ?? "No additional details."}</pre>
          </td>
        </tr>
      ) : null}
    </>
  );
}
