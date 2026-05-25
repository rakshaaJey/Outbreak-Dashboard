"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CaseCard } from "@/components/ui/case-card";
import { useCases } from "@/lib/use-cases";

const ALL_CLASSIFICATIONS = ["All", "Confirmed", "Probable", "Does Not Meet Definition"] as const;
const ALL_STATUSES = ["All", "Active", "Recovered", "Hospitalized", "Lost to Follow-Up"] as const;

export default function CasesPage() {
  const { cases } = useCases();
  const [search, setSearch] = useState("");
  const [classification, setClassification] = useState("All");
  const [status, setStatus] = useState("All");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cases.filter((c) => {
      if (classification !== "All" && c.classification !== classification) return false;
      if (status !== "All" && c.currentStatus !== status) return false;
      if (q) {
        const haystack = `${c.firstName} ${c.lastName} ${c.outbreakName} ${c.role} ${c.outbreakAgent}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [cases, search, classification, status]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Cases</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {cases.length} total case{cases.length === 1 ? "" : "s"} across all outbreaks
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, outbreak, or role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Classification filter */}
          <select
            value={classification}
            onChange={(e) => setClassification(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background text-sm"
          >
            {ALL_CLASSIFICATIONS.map((c) => (
              <option key={c} value={c}>
                {c === "Does Not Meet Definition" ? "DNM" : c}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background text-sm"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No cases match your filters.
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Showing {filtered.length} case{filtered.length === 1 ? "" : "s"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((c) => (
                <CaseCard
                  key={c.id}
                  id={c.id}
                  firstName={c.firstName}
                  lastName={c.lastName}
                  gender={c.gender}
                  role={c.role}
                  classification={c.classification}
                  currentStatus={c.currentStatus}
                  outbreakName={c.outbreakName}
                  outbreakSetting={c.outbreakSetting}
                  symptomOnset={c.symptomOnset}
                  asx={c.asx}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
