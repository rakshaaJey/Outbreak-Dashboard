"use client";

import { useState } from "react";
import { BarChart3, Map, Filter } from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { StatsView } from "@/components/stats-view";
import { MapView } from "@/components/map-view";
import { DateRangePicker } from "@/components/date-range-picker";

const STATUS_OPTIONS = ["All", "Active", "Inactive"] as const;

export default function Home() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [status, setStatus] = useState("All");
  const [setting, setSetting] = useState("");
  const [outbreakType, setOutbreakType] = useState("");
  const [agent, setAgent] = useState("");

  const filtersActive =
    status !== "All" || setting !== "" || outbreakType !== "" || agent !== "";

  function resetFilters() {
    setStatus("All");
    setSetting("");
    setOutbreakType("");
    setAgent("");
  }

  return (
    <div className="flex flex-col h-full p-6 min-h-0">
      {/* Page header */}
      <div className="shrink-0 mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Current information about outbreaks in healthcare settings in Toronto</p>
      </div>

      <Tabs defaultValue="stats" className="flex-1 min-h-0 w-full">
        <TabsList className="shrink-0">
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Stats View
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-2">
            <Map className="h-4 w-4" />
            Map View
          </TabsTrigger>
        </TabsList>

        {/* Content row — sits below the tab bar and fills the rest */}
        <div className="flex flex-col lg:flex-row gap-6 mt-4 flex-1 min-h-0">
          {/* Tab panels */}
          <div className="flex-1 min-w-0 min-h-0">
            <TabsContent value="stats" className="mt-0 h-full overflow-y-auto">
              <StatsView
                startDate={startDate}
                endDate={endDate}
                status={status}
                setting={setting}
                outbreakType={outbreakType}
                agent={agent}
              />
            </TabsContent>
            <TabsContent value="map" className="mt-0 h-full overflow-hidden">
              <MapView
                startDate={startDate}
                endDate={endDate}
                status={status}
                setting={setting}
                outbreakType={outbreakType}
                agent={agent}
              />
            </TabsContent>
          </div>

          {/* Filter sidebar */}
          <div className="w-full lg:w-72 shrink-0 space-y-4 overflow-y-auto">
            <DateRangePicker
              onDateRangeChange={(s, e) => {
                setStartDate(s);
                setEndDate(e);
              }}
            />

            <div className="rounded-lg border p-4 bg-card space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <h3 className="font-semibold">More Filters</h3>
                </div>
                {filtersActive && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Status pills */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        status === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-border"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outbreak Setting */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1.5">
                  Outbreak Setting
                </label>
                <select
                  value={setting}
                  onChange={(e) => setSetting(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground text-sm"
                >
                  <option value="">All Settings</option>
                  <option>LTCH</option>
                  <option>Hospital-Acute Care</option>
                  <option>Hospital-Chronic Care</option>
                  <option>Retirement Home</option>
                  <option>Transitional Care</option>
                </select>
              </div>

              {/* Type of Outbreak */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1.5">
                  Type of Outbreak
                </label>
                <select
                  value={outbreakType}
                  onChange={(e) => setOutbreakType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground text-sm"
                >
                  <option value="">All Types</option>
                  <option>Respiratory</option>
                  <option>Gastroenteric</option>
                </select>
              </div>

              {/* Causative Agent */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1.5">
                  Causative Agent
                </label>
                <select
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground text-sm"
                >
                  <option value="">All Agents</option>
                  <option>COVID-19</option>
                  <option>Influenza A</option>
                  <option>Influenza B</option>
                  <option>Norovirus</option>
                  <option>Respiratory syncytial virus</option>
                  <option>Enterovirus/ Rhinovirus</option>
                  <option>Parainfluenza</option>
                  <option>Metapneumovirus</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
