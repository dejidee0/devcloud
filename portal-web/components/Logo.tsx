import { useId } from "react";

/** The DevCloud icon: gold-gradient rounded square with a green→gold node connection. */
export function LogoMark({ size = 32 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label="DevCloud" style={{ flexShrink: 0, display: "block" }}>
      <defs>
        <linearGradient id={id} x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F5A623" />
          <stop offset="1" stopColor="#FFC861" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="14" stroke={`url(#${id})`} strokeWidth="4" />
      <line x1="24" y1="24" x2="40" y2="40" stroke={`url(#${id})`} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
      <circle cx="24" cy="24" r="5" fill="#00D97E" />
      <circle cx="40" cy="40" r="5" fill="#F5A623" />
    </svg>
  );
}

/** Full lockup: icon + "DevCloud" wordmark (Dev = white, Cloud = gold), weight 500. */
export function Logo({ height = 28, color = "#ededed" }: { height?: number; color?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <LogoMark size={height} />
      <span style={{ fontSize: Math.round(height * 0.66), fontWeight: 500, letterSpacing: -0.5, lineHeight: 1 }}>
        <span style={{ color }}>Dev</span><span style={{ color: "#F5A623" }}>Cloud</span>
      </span>
    </span>
  );
}
