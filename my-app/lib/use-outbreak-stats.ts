"use client";

import { useState, useEffect, useCallback } from "react";

export interface OutbreakStatsRow {
  totalPopulation: string;
  populationInArea: string;
  fluVaxRate: string;
  totalIll: string;
  cxrPneumonia: string;
  hospitalizations: string;
  deaths: string;
}

export interface OutbreakStats {
  residents: OutbreakStatsRow;
  staff: OutbreakStatsRow;
}

const EMPTY_ROW: OutbreakStatsRow = {
  totalPopulation: "",
  populationInArea: "",
  fluVaxRate: "",
  totalIll: "",
  cxrPneumonia: "",
  hospitalizations: "",
  deaths: "",
};

const EMPTY: OutbreakStats = {
  residents: { ...EMPTY_ROW },
  staff: { ...EMPTY_ROW },
};

const KEY = (id: string) => `trace-stats-${id}`;

export function useOutbreakStats(outbreakId: string) {
  const [stats, setStats] = useState<OutbreakStats>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY(outbreakId));
      if (stored) setStats(JSON.parse(stored));
      else setStats(EMPTY);
    } catch {}
    setLoaded(true);
  }, [outbreakId]);

  const setField = useCallback(
    (group: keyof OutbreakStats, field: keyof OutbreakStatsRow, value: string) => {
      setStats((prev) => {
        const next = { ...prev, [group]: { ...prev[group], [field]: value } };
        try { localStorage.setItem(KEY(outbreakId), JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [outbreakId],
  );

  return { stats, loaded, setField };
}
