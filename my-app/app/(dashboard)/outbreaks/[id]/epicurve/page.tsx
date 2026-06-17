"use client";

import { useMemo, useState, useEffect } from "react";
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
import { useLinelist } from "@/lib/use-linelist";
import type { LinelistRow } from "@/lib/use-linelist";
import { useOutbreak } from "@/lib/outbreak-context";

// ─── helpers ────────────────────────────────────────────────────────────────

function findCol(cols: string[], ...pats: RegExp[]): string | null {
  for (const p of pats) {
    const m = cols.find((c) => p.test(c));
    if (m) return m;
  }
  return null;
}

const DNM_RE = /does not meet|dnm|d\.n\.m/i;
const BAR_COLORS = ["#ef4444", "#f97316", "#3b82f6", "#8b5cf6", "#22c55e", "#94a3b8"];

// ─── page ───────────────────────────────────────────────────────────────────

type RoleFilter = "both" | "residents" | "staff";

export default function EpiCurvePage() {
  const record = useOutbreak();
  const { data: linelist } = useLinelist(record.id);
  const [mounted, setMounted] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("both");

  useEffect(() => { setMounted(true); }, []);

  const detectedCols = useMemo(() => {
    if (!linelist) return null;
    const c = linelist.columns;
    return {
      date: findCol(c, /onset/i, /symptom.*date/i, /date.*symptom/i, /date/i),
      cls:  findCol(c, /classif/i, /class/i),
      role: findCol(c, /\brole\b/i, /\btype\b/i),
    };
  }, [linelist]);

  const filteredRows = useMemo(() => {
    if (!linelist) return [] as LinelistRow[];
    const roleCol = detectedCols?.role;
    if (!roleCol || roleFilter === "both") return linelist.rows;
    return linelist.rows.filter((row) => {
      const val = String(row[roleCol] ?? "").toLowerCase();
      if (roleFilter === "residents") return /resident/.test(val);
      return /staff|employee/.test(val);
    });
  }, [linelist, detectedCols, roleFilter]);

  const epiCurve = useMemo(() => {
    if (!linelist || !detectedCols?.date) return null;

    const dateCol  = detectedCols.date;
    const classCol = detectedCols.cls;

    const byDate: Record<string, Record<string, number>> = {};
    const classValues = new Set<string>();

    for (const row of filteredRows) {
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

    const refDates = [record.startDate, record.endDate, record.agentIdentifiedDate].filter(Boolean) as string[];
    for (const d of refDates) if (d && !byDate[d]) byDate[d] = {};

    const allDates = Object.keys(byDate).sort();
    if (allDates.length >= 2) {
      const cursor = new Date(allDates[0] + "T00:00:00");
      const last   = new Date(allDates[allDates.length - 1] + "T00:00:00");
      while (cursor <= last) {
        const iso = cursor.toISOString().slice(0, 10);
        if (!byDate[iso]) byDate[iso] = {};
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    const classes = Array.from(classValues);
    const rows = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date,
        ...Object.fromEntries(classes.map((c) => [c, counts[c] ?? 0])),
      }));

    return { rows, classes, dateCol, classCol };
  }, [filteredRows, linelist, detectedCols, record.startDate, record.endDate, record.agentIdentifiedDate]);

  if (!linelist) {
    return (
      <div className="rounded-xl border flex flex-col h-48 items-center justify-center gap-2 text-xs text-muted-foreground">
        <p>No line list uploaded.</p>
        <p>Upload a line list on the <span className="font-medium">Line List</span> tab to generate an epi curve.</p>
      </div>
    );
  }

  if (!epiCurve) {
    return (
      <div className="rounded-xl border flex h-48 items-center justify-center text-xs text-muted-foreground">
        No date column detected in the line list.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="text-sm font-semibold mb-0.5">Epi Curve</h2>
      <p className="text-xs text-muted-foreground mb-3">
        Cases by <span className="font-medium">{epiCurve.dateCol}</span>
        {epiCurve.classCol && <>, grouped by <span className="font-medium">{epiCurve.classCol}</span></>}
        {" · "}DNM excluded
      </p>

      {/* Role filter */}
      {detectedCols?.role && (
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-xs text-muted-foreground font-medium mr-0.5">Show:</span>
          {(["both", "residents", "staff"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setRoleFilter(opt)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                roleFilter === opt
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-border text-muted-foreground"
              }`}
            >
              {opt === "both" ? "Both" : opt === "residents" ? "Residents" : "Staff"}
            </button>
          ))}
          {roleFilter !== "both" && (
            <span className="text-xs text-muted-foreground ml-1">
              ({filteredRows.length} of {linelist?.rows.length ?? 0})
            </span>
          )}
        </div>
      )}

      {/* Reference line legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
        {record.startDate && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 border-t-2 border-dashed border-red-500" />
            Outbreak declared ({record.startDate})
          </span>
        )}
        {record.endDate && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 border-t-2 border-dashed border-green-500" />
            Outbreak end ({record.endDate})
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
        <ResponsiveContainer width="100%" height={260}>
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

            {record.startDate && (
              <ReferenceLine
                x={record.startDate}
                stroke="#ef4444"
                strokeDasharray="5 3"
                strokeWidth={1.5}
                label={{ value: "Declared", position: "insideTopRight", fontSize: 10, fill: "#ef4444", dy: -4 }}
              />
            )}
            {record.endDate && (
              <ReferenceLine
                x={record.endDate}
                stroke="#22c55e"
                strokeDasharray="5 3"
                strokeWidth={1.5}
                label={{ value: "End", position: "insideTopRight", fontSize: 10, fill: "#22c55e", dy: -4 }}
              />
            )}
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
        <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground">
          Loading chart…
        </div>
      )}
    </div>
  );
}
