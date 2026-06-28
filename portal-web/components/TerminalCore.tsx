"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export function TerminalCore() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const term = new Terminal({ cursorBlink: true, theme: { background: "#0f0f0f", foreground: "#ededed", cursor: "#00D97E" } });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(ref.current);
    fit.fit();
    term.writeln("DevCloud Teleport WebSocket target: https://codemonk-devcloud-01:3080");
    term.writeln("Connect flow is delegated to the authenticated backend terminal proxy.");
    return () => term.dispose();
  }, []);
  return <div ref={ref} style={{ height: 176, padding: 8 }} />;
}
