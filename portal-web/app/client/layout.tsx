export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <main style={{ minHeight: "100vh", background: "var(--bg-base)", padding: 20 }}>{children}</main>;
}
