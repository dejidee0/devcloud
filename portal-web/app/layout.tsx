import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const description = "Secure cloud development environments, global infrastructure, AI-powered workflows, and enterprise-grade governance — all in one platform.";

export const metadata: Metadata = {
  title: "DevCloud — Secure Remote Development Platform",
  description,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" }
    ],
    apple: "/apple-touch-icon.png"
  },
  openGraph: {
    title: "DevCloud — Secure Remote Development Platform",
    description,
    siteName: "DevCloud",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "DevCloud" }],
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "DevCloud — Secure Remote Development Platform",
    description,
    images: ["/icon-512.png"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
