"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { Search } from "lucide-react";
import { OutbreakCard } from "@/components/ui/outbreak-card";

interface OutbreakRecord {
  _id: string;
  "Institution Name": string;
  "Institution Address": string;
  "Outbreak Setting": string;
  "Type of Outbreak": string;
  "Causative Agent-1": string;
  "Causative Agent-2": string;
  "Date Outbreak Began": string;
  "Date Declared Over": string;
  Active: string;
}

export default function OutbreaksPage() {
  const [records, setRecords] = useState<OutbreakRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/outbreaks.csv");
        if (!res.ok) throw new Error("Failed to load outbreaks.csv");
        const { data } = Papa.parse<OutbreakRecord>(await res.text(), {
          header: true,
          skipEmptyLines: true,
        });
        setRecords(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeRecords = useMemo(() => records.filter((r) => r.Active === "Y"), [records]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return activeRecords;
    return activeRecords.filter((r) =>
      r["Institution Name"].toLowerCase().includes(q) ||
      r["Institution Address"].toLowerCase().includes(q) ||
      r["Causative Agent-1"].toLowerCase().includes(q) ||
      r["Outbreak Setting"].toLowerCase().includes(q)
    );
  }, [activeRecords, search]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Current Outbreaks</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? "Loading…" : `${activeRecords.length} active outbreak${activeRecords.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, address, or agent…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading outbreaks…
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No active outbreaks match your search.
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Showing {filtered.length} outbreak{filtered.length === 1 ? "" : "s"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((r) => (
                <OutbreakCard
                  key={r._id}
                  id={r._id}
                  institutionName={r["Institution Name"]}
                  address={r["Institution Address"]}
                  agent={r["Causative Agent-1"]}
                  outbreakType={r["Type of Outbreak"]}
                  setting={r["Outbreak Setting"]}
                  startDate={r["Date Outbreak Began"]}
                  active={true}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
