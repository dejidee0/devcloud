"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

/** Fetches a resource and automatically refreshes it on an interval. */
export function usePoll<T>(path: string, intervalMs = 30000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const value = await api<T>(path);
      setData(value);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    let active = true;
    void load();
    const id = setInterval(() => {
      if (active) void load();
    }, intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [load, intervalMs]);

  return { data, error, loading, refresh: load };
}
