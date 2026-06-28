"use client";

import { DataTable } from "@/components/DataTable";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useApi } from "@/lib/use-api";
import type { User } from "@/types/models";

export default function TeamPage() {
  const users = useApi<User[]>("/api/users");
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center" }}><h1 style={{ marginRight: "auto" }}>Team</h1><button>Invite</button></header>
      {users.loading ? <SkeletonLoader /> : users.error ? <p className="error-line">{users.error}</p> : (
        <DataTable rows={(users.data ?? []) as unknown as Record<string, unknown>[]} columns={[
          { key: "fullName", label: "Name" },
          { key: "role", label: "Role" },
          { key: "email", label: "Email" },
          { key: "lastLogin", label: "Last active" },
          { key: "isActive", label: "Status" }
        ]} />
      )}
    </div>
  );
}
