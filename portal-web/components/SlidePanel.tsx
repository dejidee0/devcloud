export function SlidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <aside style={{ borderLeft: "1px solid var(--border)", background: "var(--bg-surface)", padding: 16 }}>
      <h2 style={{ fontSize: 16, marginTop: 0 }}>{title}</h2>
      {children}
    </aside>
  );
}
