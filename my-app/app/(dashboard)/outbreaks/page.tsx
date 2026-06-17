"use client";

import { useMemo, useState, useEffect } from "react";
import { Plus, Search, X, Trash2 } from "lucide-react";
import { OutbreakCard } from "@/components/ui/outbreak-card";
import { UnassignedOutbreakCard } from "@/components/ui/unassigned-outbreak-card";
import { AddOutbreakSheet } from "@/components/ui/add-outbreak-sheet";
import { useManagedOutbreaks, type ManagedOutbreak } from "@/lib/managed-outbreaks";
import { Button } from "@/components/ui/button";

const SETTINGS = ["Hospital-Acute", "Hospital-Psych", "LTCH", "Retirement Home", "Transitional Care", "Other"];
const TYPES    = ["Respiratory", "Gastroenteric", "Other"];

type StatusFilter = "all" | "active" | "inactive";
type TabView = "current" | "unassigned";

export default function OutbreaksPage() {
  const { outbreaks, loaded, addOutbreak, removeOutbreak, updateOutbreak } = useManagedOutbreaks();
  const [tab, setTab]           = useState<TabView>("current");
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState<StatusFilter>("all");
  const [setting, setSetting]   = useState("");
  const [type, setType]         = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [claimTarget, setClaimTarget] = useState<ManagedOutbreak | null>(null);
  // Track which unassigned outbreaks have a linelist in localStorage
  const [linelistIds, setLinelistIds] = useState<Set<string>>(new Set());

  // Split into assigned (current) vs unassigned
  const currentOutbreaks    = useMemo(() => outbreaks.filter((o) => o.assigned !== false), [outbreaks]);
  const unassignedOutbreaks = useMemo(() => outbreaks.filter((o) => o.assigned === false), [outbreaks]);

  // Check localStorage for attached linelists on unassigned outbreaks
  useEffect(() => {
    if (!loaded) return;
    const ids = new Set<string>();
    for (const o of unassignedOutbreaks) {
      if (localStorage.getItem(`trace-linelist-${o.id}`)) ids.add(o.id);
    }
    setLinelistIds(ids);
  }, [loaded, unassignedOutbreaks]);

  const hasActiveFilters = status !== "all" || setting !== "" || type !== "";

  const filteredCurrent = useMemo(() => {
    const q = search.toLowerCase();
    return currentOutbreaks.filter((o) => {
      if (q && !(
        o.institutionName.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.causativeAgent.toLowerCase().includes(q) ||
        o.setting.toLowerCase().includes(q)
      )) return false;
      if (status === "active"   && !o.active) return false;
      if (status === "inactive" &&  o.active) return false;
      if (setting && o.setting !== setting)   return false;
      if (type    && o.type    !== type)      return false;
      return true;
    });
  }, [currentOutbreaks, search, status, setting, type]);

  const filteredUnassigned = useMemo(() => {
    const q = search.toLowerCase();
    return unassignedOutbreaks.filter((o) => {
      if (q && !(
        o.institutionName.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.causativeAgent.toLowerCase().includes(q) ||
        o.setting.toLowerCase().includes(q)
      )) return false;
      if (setting && o.setting !== setting) return false;
      if (type    && o.type    !== type)    return false;
      return true;
    });
  }, [unassignedOutbreaks, search, setting, type]);

  function clearFilters() {
    setStatus("all");
    setSetting("");
    setType("");
  }

  function handleClaim(data: Omit<ManagedOutbreak, "id" | "createdAt">) {
    if (!claimTarget) return;
    updateOutbreak(claimTarget.id, { ...data, assigned: true });
    setClaimTarget(null);
  }

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="shrink-0 px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold">Outbreaks</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {loaded
                  ? `${currentOutbreaks.length} managed · ${unassignedOutbreaks.length} unassigned`
                  : "Loading…"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setDeleteMode((d) => !d)}
                className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md border transition-colors ${
                  deleteMode
                    ? "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Trash2 className="h-4 w-4" />
                {deleteMode ? "Done" : "Delete"}
              </button>
              {tab === "current" && (
                <Button onClick={() => setSheetOpen(true)} size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add Outbreak
                </Button>
              )}
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-0 mb-4 border-b -mx-6 px-6">
            {(["current", "unassigned"] as TabView[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setDeleteMode(false); }}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "current" ? "Current Outbreaks" : (
                  <span className="flex items-center gap-1.5">
                    Unassigned
                    {unassignedOutbreaks.length > 0 && (
                      <span className="inline-flex items-center justify-center h-4.5 min-w-4.5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-semibold leading-none">
                        {unassignedOutbreaks.length}
                      </span>
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, address, or agent…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2">
            {tab === "current" && (
              <div className="flex rounded-md border border-border overflow-hidden text-xs font-medium">
                {(["all", "active", "inactive"] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 capitalize transition-colors ${
                      status === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    } ${s !== "all" ? "border-l border-border" : ""}`}
                  >
                    {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            )}

            <select
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Settings</option>
              {SETTINGS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Types</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Content grid */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {!loaded ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : tab === "current" ? (
            currentOutbreaks.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-muted-foreground">No outbreaks on record yet.</p>
                <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add the first outbreak
                </Button>
              </div>
            ) : filteredCurrent.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <p>No outbreaks match your search or filters.</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs underline underline-offset-2 hover:text-foreground transition-colors">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  Showing {filteredCurrent.length} outbreak{filteredCurrent.length === 1 ? "" : "s"}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredCurrent.map((o) => (
                    <OutbreakCard
                      key={o.id}
                      id={o.id}
                      outbreakNumber={o.outbreakNumber}
                      institutionName={o.institutionName}
                      address={o.address}
                      agent={o.causativeAgent}
                      outbreakType={o.type}
                      setting={o.setting}
                      startDate={o.startDate}
                      active={o.active}
                      deleteMode={deleteMode}
                      onRemove={() => removeOutbreak(o.id)}
                    />
                  ))}
                </div>
              </>
            )
          ) : (
            // Unassigned tab
            unassignedOutbreaks.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm text-muted-foreground">No unassigned outbreaks.</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Unassigned outbreaks appear here when facilities submit a report via the intake form.
                </p>
              </div>
            ) : filteredUnassigned.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <p>No unassigned outbreaks match your search or filters.</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs underline underline-offset-2 hover:text-foreground transition-colors">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  {filteredUnassigned.length} unassigned outbreak{filteredUnassigned.length === 1 ? "" : "s"} awaiting assignment
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredUnassigned.map((o) => (
                    <UnassignedOutbreakCard
                      key={o.id}
                      outbreak={o}
                      hasLinelist={linelistIds.has(o.id)}
                      deleteMode={deleteMode}
                      onClaim={() => setClaimTarget(o)}
                      onRemove={() => removeOutbreak(o.id)}
                    />
                  ))}
                </div>
              </>
            )
          )}
        </div>
      </div>

      {/* Add new outbreak (current tab) */}
      <AddOutbreakSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAdd={addOutbreak}
      />

      {/* Claim / assign unassigned outbreak */}
      <AddOutbreakSheet
        open={claimTarget !== null}
        onOpenChange={(open) => { if (!open) setClaimTarget(null); }}
        initial={claimTarget ?? undefined}
        onAdd={handleClaim}
      />
    </>
  );
}
