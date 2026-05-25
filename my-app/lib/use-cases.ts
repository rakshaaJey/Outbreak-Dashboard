"use client";

import { useState, useEffect, useCallback } from "react";
import { LINELIST_CASES } from "./linelist-data";
import type { LinelistCase } from "./linelist-data";

const STORAGE_KEY = "outbreak-dashboard-cases-v1";

export function useCases() {
  const [cases, setCases] = useState<LinelistCase[]>(LINELIST_CASES);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setCases(JSON.parse(stored));
    } catch {
      // ignore parse errors — fall back to defaults
    }
  }, []);

  const updateCase = useCallback((id: string, updates: Partial<LinelistCase>) => {
    setCases((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  }, []);

  return { cases, updateCase };
}
