"use client";

import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { apiUrl, authToken } from "@/lib/api";

type Status = "connecting" | "connected" | "disconnected";

const STATUS_COLOR: Record<Status, string> = { connecting: "#FB923C", connected: "#00D97E", disconnected: "#FF3B30" };
const STATUS_LABEL: Record<Status, string> = { connecting: "Connecting", connected: "Connected", disconnected: "Disconnected" };

export function InteractiveTerminal() {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("connecting");

  useEffect(() => {
    if (!ref.current) return;
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      theme: { background: "#0a0a0a", foreground: "#ededed", cursor: "#00D97E" }
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(ref.current);
    fit.fit();
    term.writeln("DevCloud terminal — connecting to the Hetzner host over SSH…");

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(apiUrl("/hubs/terminal"), { accessTokenFactory: () => authToken() ?? "" })
      .withAutomaticReconnect()
      .build();

    connection.on("output", (data: string) => term.write(data));
    connection.on("ready", () => { setStatus("connected"); term.focus(); });
    connection.onreconnecting(() => setStatus("connecting"));
    connection.onreconnected(() => { setStatus("connected"); void connection.invoke("Start", term.cols, term.rows); });
    connection.onclose(() => setStatus("disconnected"));

    let disposed = false;
    connection.start()
      .then(() => { if (!disposed) return connection.invoke("Start", term.cols, term.rows); })
      .catch((err) => { setStatus("disconnected"); term.writeln(`\r\nConnection failed: ${err?.message ?? err}`); });

    const onData = term.onData((d) => { void connection.invoke("Input", d).catch(() => undefined); });

    const onResize = () => { try { fit.fit(); } catch { /* ignore */ } };
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      onData.dispose();
      void connection.stop();
      term.dispose();
    };
  }, []);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: 999, background: STATUS_COLOR[status] }} />
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{STATUS_LABEL[status]}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>Type commands like <span className="mono">ls</span>, <span className="mono">docker ps</span></span>
      </div>
      <div ref={ref} style={{ height: "60vh", minHeight: 320, maxHeight: 640, padding: 8, background: "#0a0a0a", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }} />
    </div>
  );
}
