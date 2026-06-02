"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Microscope,
  Building2,
  Activity,
  Clock,
  FlaskConical,
  Pencil,
} from "lucide-react";
import { useManagedOutbreaks } from "@/lib/managed-outbreaks";
import { useLinelist } from "@/lib/use-linelist";
import type { LinelistRow } from "@/lib/use-linelist";
import { LinelistUpload, LinelistUploadButton } from "@/components/ui/linelist-upload";
import { AddOutbreakSheet } from "@/components/ui/add-outbreak-sheet";

// ─── helpers ────────────────────────────────────────────────────────────────

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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

function cellDisplay(val: LinelistRow[string]): string {
  if (val === null || val === undefined || val === "") return "—";
  if (val instanceof Date) return val.toLocaleDateString("en-CA");
  return String(val);
}

function findCol(cols: string[], ...pats: RegExp[]): string | null {
  for (const p of pats) {
    const m = cols.find((c) => p.test(c));
    if (m) return m;
  }
  return null;
}

const DNM_RE = /does not meet|dnm|d\.n\.m/i;
const BAR_COLORS = ["#ef4444", "#f97316", "#3b82f6", "#8b5cf6", "#22c55e", "#94a3b8"];

// Column names that represent individual symptoms (Y/N fields)
const SYMPTOM_COL_RE =
  /\b(fever|cough|shortness.of.breath|sob|fatigue|headache|sore.?throat|myalgia|chills|asymptomatic|asx|nausea|vomiting|diarrh?o?ea|rash|runny.nose|congestion|loss.of.taste|loss.of.smell|body.ache|aches|rigors)\b/i;

function isActiveSymptom(val: LinelistRow[string]): boolean {
  const s = String(val ?? "").trim().toLowerCase();
  return s === "y" || s === "yes" || s === "true" || s === "1";
}

type RegularCol  = { kind: "regular";  name: string };
type SymptomsCol = { kind: "symptoms"; cols: string[] };
type TableCol    = RegularCol | SymptomsCol;

// ─── page ───────────────────────────────────────────────────────────────────

export default function OutbreakDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { outbreaks, loaded, updateOutbreak } = useManagedOutbreaks();
  const { data: linelist, loaded: linelistLoaded, upload, clear } = useLinelist(id);
  const [mounted, setMounted] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [genderFilter, setGenderFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Reset filters whenever a new file is loaded
  useEffect(() => { setGenderFilter(""); setRoleFilter(""); }, [linelist]);

  const record = useMemo(
    () => outbreaks.find((o) => o.id === id) ?? null,
    [outbreaks, id],
  );

  // Detect which columns carry date / classification / gender / role
  const detectedCols = useMemo(() => {
    if (!linelist) return null;
    const c = linelist.columns;
    return {
      date:   findCol(c, /onset/i, /symptom.*date/i, /date.*symptom/i, /date/i),
      cls:    findCol(c, /classif/i, /class/i),
      gender: findCol(c, /gender/i, /sex/i),
      role:   findCol(c, /\brole\b/i),
    };
  }, [linelist]);

  // Unique options for the filter dropdowns
  const filterOptions = useMemo(() => {
    if (!linelist || !detectedCols) return { genders: [] as string[], roles: [] as string[] };
    const uniq = (col: string | null) =>
      col
        ? [...new Set(linelist.rows.map((r) => String(r[col] ?? "")).filter(Boolean))].sort()
        : [];
    return { genders: uniq(detectedCols.gender), roles: uniq(detectedCols.role) };
  }, [linelist, detectedCols]);

  // Table rows after gender/role filters
  const filteredRows = useMemo(() => {
    if (!linelist) return [];
    return linelist.rows.filter((row) => {
      if (genderFilter && detectedCols?.gender && String(row[detectedCols.gender] ?? "") !== genderFilter) return false;
      if (roleFilter   && detectedCols?.role   && String(row[detectedCols.role]   ?? "") !== roleFilter)   return false;
      return true;
    });
  }, [linelist, detectedCols, genderFilter, roleFilter]);

  // Merge symptom Y/N columns into a single virtual "Symptoms" column
  const tableLayout = useMemo((): TableCol[] => {
    if (!linelist) return [];
    const symptomCols = new Set(linelist.columns.filter((c) => SYMPTOM_COL_RE.test(c)));
    if (symptomCols.size === 0) return linelist.columns.map((name) => ({ kind: "regular", name }));

    const orderedSymptoms = linelist.columns.filter((c) => symptomCols.has(c));
    let symptomInserted = false;
    const result: TableCol[] = [];
    for (const col of linelist.columns) {
      if (symptomCols.has(col)) {
        if (!symptomInserted) {
          result.push({ kind: "symptoms", cols: orderedSymptoms });
          symptomInserted = true;
        }
      } else {
        result.push({ kind: "regular", name: col });
      }
    }
    return result;
  }, [linelist]);

  // Epi curve built from filtered rows; DNMs excluded; reference dates injected
  const epiCurve = useMemo(() => {
    if (!linelist || !detectedCols?.date) return null;

    const dateCol  = detectedCols.date;
    const classCol = detectedCols.cls;

    const byDate: Record<string, Record<string, number>> = {};
    const classValues = new Set<string>();

    for (const row of filteredRows) {
      // Skip DNM rows
      if (classCol && DNM_RE.test(String(row[classCol] ?? ""))) continue;

      const dateRaw = row[dateCol];
      if (!dateRaw) continue;
      const date =
        dateRaw instanceof Date
          ? dateRaw.toISOString().slice(0, 10)
          : String(dateRaw).slice(0, 10);
      if (!date || date === "—") continue;

      const cls = classCol ? String(row[classCol] ?? "Unknown") : "Cases";
      classValues.add(cls);
      if (!byDate[date]) byDate[date] = {};
      byDate[date][cls] = (byDate[date][cls] ?? 0) + 1;
    }

    // Ensure reference dates appear as data-points on the x-axis (0 counts) so
    // ReferenceLine has a position to snap to even when no cases fell on that day.
    const refDates = [record?.startDate, record?.agentIdentifiedDate].filter(Boolean) as string[];
    for (const d of refDates) if (d && !byDate[d]) byDate[d] = {};

    const classes = Array.from(classValues);
    const rows = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date,
        ...Object.fromEntries(classes.map((c) => [c, counts[c] ?? 0])),
      }));

    return { rows, classes, dateCol, classCol };
  }, [linelist, detectedCols, filteredRows, record]);

  // ── loading / not found guards ─────────────────────────────────────────────

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-6">
        Loading outbreak details…
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 p-6">
        <p className="text-sm text-red-500">Outbreak not found.</p>
        <button onClick={() => router.back()} className="text-sm text-muted-foreground underline underline-offset-2">
          Go back
        </button>
      </div>
    );
  }

  const hasFilters = filterOptions.genders.length > 0 || filterOptions.roles.length > 0;

  // ── render ─────────────────────────────────────────────────────────────────

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
          <h1 className="text-xl font-bold truncate">{record.institutionName}</h1>
          <p className="text-sm text-muted-foreground truncate">{record.address}</p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
            record.active
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
              : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${record.active ? "bg-green-500" : "bg-red-500"}`} />
          {record.active ? "Active" : "Inactive"}
        </span>
        <button
          onClick={() => setEditOpen(true)}
          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Edit outbreak"
          title="Edit outbreak"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Left sidebar */}
        <div className="lg:w-72 xl:w-80 shrink-0 overflow-y-auto border-r px-5 py-5 space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Outbreak Details</h2>
            <DetailRow icon={<Building2 className="h-4 w-4" />} label="Setting"          value={record.setting} />
            <DetailRow icon={<Activity   className="h-4 w-4" />} label="Type of Outbreak" value={record.type} />
            <DetailRow icon={<Microscope className="h-4 w-4" />} label="Causative Agent"  value={record.causativeAgent || "Unknown / Pending"} />
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Timeline</h2>
            <DetailRow icon={<Calendar     className="h-4 w-4" />} label="Outbreak Start Date" value={record.startDate} />
            <DetailRow icon={<FlaskConical className="h-4 w-4" />} label="Agent Identified"     value={record.agentIdentifiedDate || ""} />
            <DetailRow icon={<Clock        className="h-4 w-4" />} label="Status"               value={record.active ? "Ongoing" : "Declared Over"} />
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Location</h2>
            <DetailRow icon={<MapPin className="h-4 w-4" />} label="Address" value={record.address} />
          </div>
        </div>

        {/* Right: linelist + epi curve */}
        <div className="flex-1 min-w-0 overflow-y-auto px-5 py-5 space-y-4">
          {/* Linelist header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Line List</h2>
              <p className="text-xs text-muted-foreground">
                {linelist
                  ? `${filteredRows.length} of ${linelist.rows.length} row${linelist.rows.length === 1 ? "" : "s"} · ${linelist.fileName}`
                  : "No line list uploaded yet"}
              </p>
            </div>
            {linelist && linelistLoaded && (
              <div className="flex items-center gap-2">
                <LinelistUploadButton onUpload={upload} />
                <button
                  onClick={clear}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Filter bar — only shown when gender/role columns are detected */}
          {linelist && hasFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {filterOptions.genders.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Gender</label>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="h-7 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">All</option>
                    {filterOptions.genders.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              )}
              {filterOptions.roles.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Role</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="h-7 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">All</option>
                    {filterOptions.roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}
              {(genderFilter || roleFilter) && (
                <button
                  onClick={() => { setGenderFilter(""); setRoleFilter(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Linelist body */}
          {!linelistLoaded ? (
            <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">Loading…</div>
          ) : !linelist ? (
            <LinelistUpload onUpload={upload} onClear={clear} />
          ) : filteredRows.length === 0 ? (
            <div className="rounded-xl border flex h-32 items-center justify-center text-xs text-muted-foreground">
              No rows match the current filters.
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted/80 backdrop-blur text-muted-foreground">
                    {tableLayout.map((col) =>
                      col.kind === "regular" ? (
                        <th key={col.name} className="text-left px-3 py-2.5 font-medium border-b whitespace-nowrap">
                          {col.name}
                        </th>
                      ) : (
                        <th key="__symptoms__" className="text-left px-3 py-2.5 font-medium border-b whitespace-nowrap">
                          Symptoms
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      {tableLayout.map((col) => {
                        if (col.kind === "regular") {
                          const d = cellDisplay(row[col.name]);
                          return (
                            <td
                              key={col.name}
                              className="px-3 py-2.5 whitespace-nowrap max-w-[200px] truncate"
                              title={d === "—" ? undefined : d}
                            >
                              {d}
                            </td>
                          );
                        }
                        // Symptoms cell: show pills for active symptoms only
                        const active = col.cols.filter((s) => isActiveSymptom(row[s]));
                        return (
                          <td key="__symptoms__" className="px-3 py-2.5">
                            {active.length === 0 ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {active.map((s) => (
                                  <span
                                    key={s}
                                    className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 whitespace-nowrap"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Epi curve */}
          {linelist && epiCurve && (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-semibold mb-0.5">Epi Curve</h2>
              <p className="text-xs text-muted-foreground mb-1">
                Cases by <span className="font-medium">{epiCurve.dateCol}</span>
                {epiCurve.classCol && <>, grouped by <span className="font-medium">{epiCurve.classCol}</span></>}
                {" · "}DNM excluded
              </p>
              {/* Reference line legend */}
              <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
                {record.startDate && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-5 border-t-2 border-dashed border-red-500" />
                    Outbreak start ({record.startDate})
                  </span>
                )}
                {record.agentIdentifiedDate && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-5 border-t-2 border-dashed border-blue-500" />
                    Agent identified ({record.agentIdentifiedDate})
                  </span>
                )}
              </div>
              {mounted ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={epiCurve.rows} margin={{ top: 16, right: 8, left: -16, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(d) => {
                        const dt = new Date(d + "T00:00:00");
                        return isNaN(dt.getTime())
                          ? d
                          : dt.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
                      }}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickCount={4} />
                    <Tooltip
                      contentStyle={{ fontSize: 12 }}
                      labelFormatter={(label) => {
                        const dt = new Date(label + "T00:00:00");
                        return isNaN(dt.getTime())
                          ? label
                          : dt.toLocaleDateString("en-CA", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />

                    {/* Reference line: outbreak start */}
                    {record.startDate && (
                      <ReferenceLine
                        x={record.startDate}
                        stroke="#ef4444"
                        strokeDasharray="5 3"
                        strokeWidth={1.5}
                        label={{ value: "Start", position: "insideTopRight", fontSize: 10, fill: "#ef4444", dy: -4 }}
                      />
                    )}

                    {/* Reference line: agent identified */}
                    {record.agentIdentifiedDate && (
                      <ReferenceLine
                        x={record.agentIdentifiedDate}
                        stroke="#3b82f6"
                        strokeDasharray="5 3"
                        strokeWidth={1.5}
                        label={{ value: "Agent ID'd", position: "insideTopLeft", fontSize: 10, fill: "#3b82f6", dy: -4 }}
                      />
                    )}

                    {epiCurve.classes.map((cls, idx) => (
                      <Bar
                        key={cls}
                        dataKey={cls}
                        stackId="a"
                        fill={BAR_COLORS[idx % BAR_COLORS.length]}
                        radius={idx === epiCurve.classes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
                  Loading chart…
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AddOutbreakSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={record}
        onAdd={(data) => updateOutbreak(record.id, data)}
      />
    </div>
  );
}
