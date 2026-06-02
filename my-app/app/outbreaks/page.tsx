"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { OutbreakCard } from "@/components/ui/outbreak-card";
import { AddOutbreakSheet } from "@/components/ui/add-outbreak-sheet";
import { useManagedOutbreaks } from "@/lib/managed-outbreaks";
import { Button } from "@/components/ui/button";

export default function OutbreaksPage() {
  const { outbreaks, loaded, addOutbreak, removeOutbreak } = useManagedOutbreaks();
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return outbreaks;
    return outbreaks.filter(
      (o) =>
        o.institutionName.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.causativeAgent.toLowerCase().includes(q) ||
        o.setting.toLowerCase().includes(q)
    );
  }, [outbreaks, search]);

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="shrink-0 px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold">Current Outbreaks</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {loaded
                  ? `${outbreaks.length} outbreak${outbreaks.length === 1 ? "" : "s"} on record`
                  : "Loading…"}
              </p>
            </div>
            <Button onClick={() => setSheetOpen(true)} size="sm" className="shrink-0 gap-1.5">
              <Plus className="h-4 w-4" />
              Add Outbreak
            </Button>
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
          {!loaded ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : outbreaks.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">No outbreaks on record yet.</p>
              <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add the first outbreak
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No outbreaks match your search.
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                Showing {filtered.length} outbreak{filtered.length === 1 ? "" : "s"}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {filtered.map((o) => (
                  <OutbreakCard
                    key={o.id}
                    id={o.id}
                    institutionName={o.institutionName}
                    address={o.address}
                    agent={o.causativeAgent}
                    outbreakType={o.type}
                    setting={o.setting}
                    startDate={o.startDate}
                    active={o.active}
                    onRemove={() => removeOutbreak(o.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <AddOutbreakSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAdd={addOutbreak}
      />
    </>
  );
}
