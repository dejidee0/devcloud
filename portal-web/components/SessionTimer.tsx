"use client";

import { useEffect, useState } from "react";

export function SessionTimer({ startedAt }: { startedAt: string }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const id = setInterval(() => setSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000))), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return <span className="mono">{Math.floor(seconds / 3600)}h {Math.floor((seconds % 3600) / 60)}m</span>;
}
