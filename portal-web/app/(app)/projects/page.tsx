"use client";

import { DataTable } from "@/components/DataTable";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useApi } from "@/lib/use-api";
import type { Project } from "@/types/models";

export default function ProjectsPage() {
  const { data, error, loading } = useApi<Project[]>("/api/projects");
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ marginRight: "auto" }}>Projects</h1>
        <select><option>All statuses</option><option>Active</option><option>Paused</option></select>
        <select><option>All stacks</option><option>DotNet</option><option>NodeJS</option></select>
        <button>New project</button>
      </header>
      {loading ? <SkeletonLoader /> : error ? <p className="error-line">{error}</p> : (
        <DataTable rows={(data ?? []) as unknown as Record<string, unknown>[]} columns={[
          { key: "name", label: "Name" },
          { key: "clientName", label: "Client" },
          { key: "techStack", label: "Stack" },
          { key: "status", label: "Status" },
          { key: "ownerId", label: "Owner" }
        ]} />
      )}
    </div>
  );
}
