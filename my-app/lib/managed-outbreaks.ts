"use client";

import { useState, useEffect, useCallback } from "react";

export interface ManagedOutbreak {
  id: string;
  institutionName: string;
  address: string;
  setting: string;
  type: string;
  causativeAgent: string;
  startDate: string;
  agentIdentifiedDate: string;
  active: boolean;
  createdAt: string;
}

const STORAGE_KEY = "trace-managed-outbreaks";

export function useManagedOutbreaks() {
  const [outbreaks, setOutbreaks] = useState<ManagedOutbreak[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setOutbreaks(JSON.parse(stored));
    } catch {
      // ignore — localStorage unavailable or corrupt
    }
    setLoaded(true);
  }, []);

  const addOutbreak = useCallback((data: Omit<ManagedOutbreak, "id" | "createdAt">) => {
    const entry: ManagedOutbreak = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setOutbreaks((prev) => {
      const next = [entry, ...prev];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    return entry;
  }, []);

  const removeOutbreak = useCallback((id: string) => {
    setOutbreaks((prev) => {
      const next = prev.filter((o) => o.id !== id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const updateOutbreak = useCallback((id: string, data: Omit<ManagedOutbreak, "id" | "createdAt">) => {
    setOutbreaks((prev) => {
      const next = prev.map((o) => o.id === id ? { ...o, ...data } : o);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { outbreaks, loaded, addOutbreak, removeOutbreak, updateOutbreak };
}
