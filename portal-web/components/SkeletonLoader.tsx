export function SkeletonLoader({ rows = 6 }: { rows?: number }) {
  return <div style={{ display: "grid", gap: 10 }}>{Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton" style={{ height: 36 }} />)}</div>;
}
