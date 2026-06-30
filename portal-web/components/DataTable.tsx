export function DataTable<T extends Record<string, unknown>>({ rows, columns }: { rows: T[]; columns: { key: keyof T; label: string }[] }) {
  return (
    <div style={{ overflow: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
      <table className="responsive-table">
        <thead><tr>{columns.map((c) => <th key={String(c.key)}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)}>{columns.map((c) => <td key={String(c.key)} data-label={c.label}>{String(row[c.key] ?? "")}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
