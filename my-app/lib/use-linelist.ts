"use client";

import { useState, useEffect, useCallback } from "react";

export interface LinelistRow {
  [key: string]: string | number | boolean | Date | null;
}

export interface LinelistData {
  columns: string[];
  rows: LinelistRow[];
  fileName: string;
}

const KEY = (id: string) => `trace-linelist-${id}`;

export function useLinelist(outbreakId: string) {
  const [data, setData] = useState<LinelistData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY(outbreakId));
      if (stored) setData(JSON.parse(stored));
    } catch {}
    setLoaded(true);
  }, [outbreakId]);

  const upload = useCallback((incoming: LinelistData) => {
    setData(incoming);
    try { localStorage.setItem(KEY(outbreakId), JSON.stringify(incoming)); } catch {}
  }, [outbreakId]);

  const clear = useCallback(() => {
    setData(null);
    try { localStorage.removeItem(KEY(outbreakId)); } catch {}
  }, [outbreakId]);

  const addRow = useCallback((row: LinelistRow) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...prev, rows: [...prev.rows, row] };
      try { localStorage.setItem(KEY(outbreakId), JSON.stringify(next)); } catch {}
      return next;
    });
  }, [outbreakId]);

  const updateRow = useCallback((index: number, row: LinelistRow) => {
    setData((prev) => {
      if (!prev) return prev;
      const rows = [...prev.rows];
      rows[index] = row;
      const next = { ...prev, rows };
      try { localStorage.setItem(KEY(outbreakId), JSON.stringify(next)); } catch {}
      return next;
    });
  }, [outbreakId]);

  return { data, loaded, upload, clear, addRow, updateRow };
}
