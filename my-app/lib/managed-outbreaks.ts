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
  endDate: string;
  agentIdentifiedDate: string;
  active: boolean;
  createdAt: string;
  outbreakNumber: string;
  investigator: string;
  facilityContact: string;
  affectedFloors: string;
  /** false = submitted via intake form, awaiting investigator assignment */
  assigned: boolean;
}

const STORAGE_KEY = "trace-managed-outbreaks";

const SEED_OUTBREAKS: ManagedOutbreak[] = [
  {
    id: "seed-001",
    institutionName: "Sunnybrook Health Sciences Centre",
    address: "2075 Bayview Ave, Toronto, ON M4N 3M5",
    setting: "Hospital-Acute",
    type: "Respiratory",
    causativeAgent: "Influenza A",
    startDate: "2026-06-02",
    endDate: "",
    agentIdentifiedDate: "2026-06-04",
    active: true,
    createdAt: "2026-06-02T09:00:00.000Z",
    outbreakNumber: "ON-2026-0041",
    investigator: "Dr. Sarah Chen",
    facilityContact: "416-480-6100",
    affectedFloors: "4W, 4E",
    assigned: true,
  },
  {
    id: "seed-002",
    institutionName: "Lakeside Long Term Care",
    address: "145 Lake Promenade, Toronto, ON M8W 1A9",
    setting: "LTCH",
    type: "Gastroenteric",
    causativeAgent: "Norovirus",
    startDate: "2026-06-08",
    endDate: "",
    agentIdentifiedDate: "2026-06-10",
    active: true,
    createdAt: "2026-06-08T13:30:00.000Z",
    outbreakNumber: "ON-2026-0044",
    investigator: "James Okafor",
    facilityContact: "416-251-2391",
    affectedFloors: "2nd Floor",
    assigned: true,
  },
  {
    id: "seed-003",
    institutionName: "Baycrest Health Sciences",
    address: "3560 Bathurst St, Toronto, ON M6A 2E1",
    setting: "LTCH",
    type: "Respiratory",
    causativeAgent: "COVID-19",
    startDate: "2025-11-14",
    endDate: "2025-12-01",
    agentIdentifiedDate: "2025-11-16",
    active: false,
    createdAt: "2025-11-14T10:00:00.000Z",
    outbreakNumber: "ON-2025-0091",
    investigator: "Dr. Sarah Chen",
    facilityContact: "416-785-2500",
    affectedFloors: "3rd Floor",
    assigned: true,
  },
  {
    id: "seed-004",
    institutionName: "St. Joseph's Health Centre",
    address: "30 The Queensway, Toronto, ON M6R 1B5",
    setting: "Hospital-Acute",
    type: "Respiratory",
    causativeAgent: "Respiratory syncytial virus",
    startDate: "2026-06-10",
    endDate: "",
    agentIdentifiedDate: "",
    active: true,
    createdAt: "2026-06-10T08:45:00.000Z",
    outbreakNumber: "ON-2026-0046",
    investigator: "Marcus Webb",
    facilityContact: "416-530-6000",
    affectedFloors: "6 North",
    assigned: true,
  },
  {
    id: "seed-005",
    institutionName: "Kensington Gardens Retirement Residence",
    address: "251 Manning Ave, Toronto, ON M6J 2K6",
    setting: "Retirement Home",
    type: "Gastroenteric",
    causativeAgent: "Norovirus",
    startDate: "2026-06-12",
    endDate: "",
    agentIdentifiedDate: "2026-06-14",
    active: true,
    createdAt: "2026-06-12T11:20:00.000Z",
    outbreakNumber: "ON-2026-0047",
    investigator: "Priya Nair",
    facilityContact: "416-588-4441",
    affectedFloors: "1st Floor, 2nd Floor",
    assigned: true,
  },
  {
    id: "seed-006",
    institutionName: "Runnymede Healthcare Centre",
    address: "625 Runnymede Rd, Toronto, ON M6S 3A3",
    setting: "LTCH",
    type: "Gastroenteric",
    causativeAgent: "Norovirus",
    startDate: "2025-12-03",
    endDate: "2025-12-19",
    agentIdentifiedDate: "2025-12-05",
    active: false,
    createdAt: "2025-12-03T14:00:00.000Z",
    outbreakNumber: "ON-2025-0098",
    investigator: "James Okafor",
    facilityContact: "416-762-7316",
    affectedFloors: "2nd Floor, 3rd Floor",
    assigned: true,
  },
  {
    id: "seed-007",
    institutionName: "Cedar Ridge Manor",
    address: "1580 Midland Ave, Scarborough, ON M1P 3C3",
    setting: "Retirement Home",
    type: "Respiratory",
    causativeAgent: "",
    startDate: "2026-06-15",
    endDate: "",
    agentIdentifiedDate: "",
    active: true,
    createdAt: "2026-06-15T16:00:00.000Z",
    outbreakNumber: "",
    investigator: "",
    facilityContact: "416-759-3321",
    affectedFloors: "3rd Floor",
    assigned: false,
  },
  {
    id: "seed-008",
    institutionName: "North York General Hospital",
    address: "4001 Leslie St, North York, ON M2K 1E1",
    setting: "Hospital-Acute",
    type: "Gastroenteric",
    causativeAgent: "",
    startDate: "2026-06-16",
    endDate: "",
    agentIdentifiedDate: "",
    active: true,
    createdAt: "2026-06-16T09:15:00.000Z",
    outbreakNumber: "",
    investigator: "",
    facilityContact: "416-756-6000",
    affectedFloors: "7th Floor",
    assigned: false,
  },
];

export function useManagedOutbreaks() {
  const [outbreaks, setOutbreaks] = useState<ManagedOutbreak[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setOutbreaks(JSON.parse(stored));
      } else {
        // First visit — seed demo outbreaks
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_OUTBREAKS));
        setOutbreaks(SEED_OUTBREAKS);
      }
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
