"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Microscope,
  Building2,
  Activity,
  Clock,
} from "lucide-react";
import { LINELIST_CASES, SYMPTOM_KEYS } from "@/lib/linelist-data";
import type { LinelistCase } from "@/lib/linelist-data";

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

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function SymptomPills({ row }: { row: LinelistCase }) {
  const active = SYMPTOM_KEYS.filter((s) => row[s.key] as boolean);
  if (active.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {active.map((s) => (
        <span
          key={s.key as string}
          className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
        >
          {s.label}
        </span>
      ))}
    </div>
  );
}

function ClassificationBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    Confirmed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    Probable: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
    "Does Not Meet Definition": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${map[value] ?? "bg-muted text-muted-foreground"}`}>
      {value === "Does Not Meet Definition" ? "DNM" : value}
    </span>
  );
}

function ResultBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    Positive: "text-red-600 dark:text-red-400",
    Negative: "text-green-600 dark:text-green-400",
    Pending: "text-amber-600 dark:text-amber-400",
    Unknown: "text-muted-foreground",
    Indeterminate: "text-purple-600 dark:text-purple-400",
  };
  return <span className={`font-medium ${map[value] ?? ""}`}>{value}</span>;
}

export default function OutbreakDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<OutbreakRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const epiData = useMemo(() => {
    const byDate: Record<string, { date: string; Confirmed: number; Probable: number; DNM: number }> = {};
    for (const c of LINELIST_CASES) {
      if (!c.symptomOnset) continue;
      if (!byDate[c.symptomOnset]) {
        byDate[c.symptomOnset] = { date: c.symptomOnset, Confirmed: 0, Probable: 0, DNM: 0 };
      }
      if (c.classification === "Confirmed") byDate[c.symptomOnset].Confirmed++;
      else if (c.classification === "Probable") byDate[c.symptomOnset].Probable++;
      else byDate[c.symptomOnset].DNM++;
    }
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/outbreaks.csv");
        if (!res.ok) throw new Error("Failed to load outbreaks.csv");
        const { data } = Papa.parse<OutbreakRecord>(await res.text(), {
          header: true,
          skipEmptyLines: true,
        });
        const found = data.find((r) => r._id === id);
        if (!found) throw new Error(`Outbreak #${id} not found`);
        setRecord(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-6">
        Loading outbreak details…
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 p-6">
        <p className="text-sm text-red-500">{error ?? "Outbreak not found"}</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground underline underline-offset-2"
        >
          Go back
        </button>
      </div>
    );
  }

  const isActive = record.Active === "Y";

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top bar */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{record["Institution Name"]}</h1>
          <p className="text-sm text-muted-foreground truncate">{record["Institution Address"]}</p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
            isActive
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
              : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Body: detail cards (left) + linelist + epi curve (right) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Left: outbreak detail cards */}
        <div className="lg:w-72 xl:w-80 shrink-0 overflow-y-auto border-r px-5 py-5 space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Outbreak Details
            </h2>
            <DetailRow
              icon={<Building2 className="h-4 w-4" />}
              label="Setting"
              value={record["Outbreak Setting"]}
            />
            <DetailRow
              icon={<Activity className="h-4 w-4" />}
              label="Type of Outbreak"
              value={record["Type of Outbreak"]}
            />
            <DetailRow
              icon={<Microscope className="h-4 w-4" />}
              label="Causative Agent"
              value={
                [record["Causative Agent-1"], record["Causative Agent-2"]]
                  .filter(Boolean)
                  .join(", ") || "Unknown / Pending"
              }
            />
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Timeline
            </h2>
            <DetailRow
              icon={<Calendar className="h-4 w-4" />}
              label="Date Outbreak Began"
              value={record["Date Outbreak Began"]}
            />
            <DetailRow
              icon={<Clock className="h-4 w-4" />}
              label="Date Declared Over"
              value={record["Date Declared Over"] || "Still active"}
            />
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Location
            </h2>
            <DetailRow
              icon={<MapPin className="h-4 w-4" />}
              label="Address"
              value={record["Institution Address"]}
            />
          </div>
        </div>

        {/* Right: linelist + epi curve */}
        <div className="flex-1 min-w-0 overflow-y-auto px-5 py-5 space-y-6">
          {/* Linelist header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Line List</h2>
              <p className="text-xs text-muted-foreground">{LINELIST_CASES.length} cases recorded</p>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>
                Confirmed:{" "}
                <span className="font-medium text-red-600">
                  {LINELIST_CASES.filter((c) => c.classification === "Confirmed").length}
                </span>
              </span>
              <span>
                Probable:{" "}
                <span className="font-medium text-orange-600">
                  {LINELIST_CASES.filter((c) => c.classification === "Probable").length}
                </span>
              </span>
              <span>
                DNM:{" "}
                <span className="font-medium">
                  {LINELIST_CASES.filter((c) => c.classification === "Does Not Meet Definition").length}
                </span>
              </span>
            </div>
          </div>

          {/* Linelist table */}
          <div className="overflow-auto rounded-xl border">
            <table className="w-full text-xs border-collapse min-w-[900px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-muted/80 backdrop-blur text-muted-foreground">
                  <th className="text-left px-3 py-2.5 font-medium border-b whitespace-nowrap">Name</th>
                  <th className="text-left px-3 py-2.5 font-medium border-b whitespace-nowrap">Role</th>
                  <th className="text-left px-3 py-2.5 font-medium border-b whitespace-nowrap">Unit / Location</th>
                  <th className="text-left px-3 py-2.5 font-medium border-b whitespace-nowrap">Onset Date</th>
                  <th className="text-left px-3 py-2.5 font-medium border-b whitespace-nowrap">Symptoms</th>
                  <th className="text-left px-3 py-2.5 font-medium border-b whitespace-nowrap">Test Status</th>
                  <th className="text-left px-3 py-2.5 font-medium border-b whitespace-nowrap">Result</th>
                  <th className="text-left px-3 py-2.5 font-medium border-b whitespace-nowrap">Classification</th>
                  <th className="text-left px-3 py-2.5 font-medium border-b whitespace-nowrap">Current Status</th>
                  <th className="text-left px-3 py-2.5 font-medium border-b whitespace-nowrap">Disposition</th>
                  <th className="text-left px-3 py-2.5 font-medium border-b whitespace-nowrap">Comments</th>
                </tr>
              </thead>
              <tbody>
                {LINELIST_CASES.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Link
                        href={`/cases/${c.id}`}
                        className="font-medium hover:text-primary hover:underline underline-offset-2"
                      >
                        {c.lastName}, {c.firstName}
                      </Link>
                      <span className="ml-1 text-muted-foreground">({c.gender[0]})</span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {c.role}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{c.buildingUnit || "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{c.symptomOnset || "—"}</td>
                    <td className="px-3 py-2.5"><SymptomPills row={c} /></td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{c.testingStatus}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap"><ResultBadge value={c.testingResult} /></td>
                    <td className="px-3 py-2.5 whitespace-nowrap"><ClassificationBadge value={c.classification} /></td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{c.currentStatus}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{c.disposition || "—"}</td>
                    <td className="px-3 py-2.5 max-w-[200px] truncate" title={c.comments}>{c.comments || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Epi curve */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold mb-0.5">Epi Curve</h2>
            <p className="text-xs text-muted-foreground mb-4">Cases by symptom onset date</p>
            {mounted ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={epiData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(d) => {
                      const date = new Date(d + "T00:00:00");
                      return date.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
                    }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickCount={4} />
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    labelFormatter={(label) => {
                      const date = new Date(label + "T00:00:00");
                      return date.toLocaleDateString("en-CA", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
                    }}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey="Confirmed" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Probable" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="DNM" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
                Loading chart…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
