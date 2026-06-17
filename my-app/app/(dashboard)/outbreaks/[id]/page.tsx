"use client";

import { useMemo } from "react";
import { useOutbreakStats } from "@/lib/use-outbreak-stats";
import type { OutbreakStats, OutbreakStatsRow } from "@/lib/use-outbreak-stats";
import { useOutbreak } from "@/lib/outbreak-context";
import { useLinelist } from "@/lib/use-linelist";
import type { LinelistData, LinelistRow } from "@/lib/use-linelist";

// ── Outbreak Stats ───────────────────────────────────────────────────────────

const statCellClass =
  "w-full text-center text-xs px-1.5 py-1 rounded border border-transparent bg-transparent focus:outline-none focus:border-border hover:border-border transition-colors placeholder:text-muted-foreground/50";

function StatCell({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      className={statCellClass}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "—"}
    />
  );
}

function OutbreakStatsTables({
  stats,
  setField,
}: {
  stats: OutbreakStats;
  setField: (group: keyof OutbreakStats, field: keyof OutbreakStatsRow, value: string) => void;
}) {
  const metricLabelClass = "text-xs text-left px-3 py-2 whitespace-nowrap text-muted-foreground border-r";
  const headClass = "text-xs font-semibold text-center px-4 py-2 text-foreground whitespace-nowrap";
  const cellClass = "px-2 py-1 text-center";

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b">
        <h2 className="text-sm font-semibold">Outbreak Overview</h2>
      </div>

      <div className="flex flex-row divide-x overflow-x-auto">
        {/* Population & Illness */}
        <table className="flex-1 border-collapse">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-xs font-semibold text-left px-3 py-2 text-muted-foreground uppercase tracking-wide whitespace-nowrap border-r">
                Population &amp; Illness
              </th>
              <th className={headClass}>Residents</th>
              <th className={headClass}>Staff</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className={metricLabelClass}>Total Population</td>
              <td className={cellClass}><StatCell value={stats.residents.totalPopulation}  onChange={(v) => setField("residents", "totalPopulation",  v)} /></td>
              <td className={cellClass}><StatCell value={stats.staff.totalPopulation}      onChange={(v) => setField("staff",     "totalPopulation",  v)} /></td>
            </tr>
            <tr className="border-b">
              <td className={metricLabelClass}>Pop. in Outbreak Area</td>
              <td className={cellClass}><StatCell value={stats.residents.populationInArea} onChange={(v) => setField("residents", "populationInArea", v)} /></td>
              <td className={cellClass}><StatCell value={stats.staff.populationInArea}     onChange={(v) => setField("staff",     "populationInArea", v)} /></td>
            </tr>
            <tr className="border-b">
              <td className={metricLabelClass}>Flu Vax Rate (Area)</td>
              <td className={cellClass}><StatCell value={stats.residents.fluVaxRate}       onChange={(v) => setField("residents", "fluVaxRate",       v)} placeholder="e.g. 80%" /></td>
              <td className={cellClass}><StatCell value={stats.staff.fluVaxRate}           onChange={(v) => setField("staff",     "fluVaxRate",       v)} placeholder="e.g. 80%" /></td>
            </tr>
            <tr>
              <td className={metricLabelClass}>Total # Ill</td>
              <td className={cellClass}><StatCell value={stats.residents.totalIll}         onChange={(v) => setField("residents", "totalIll",         v)} /></td>
              <td className={cellClass}><StatCell value={stats.staff.totalIll}             onChange={(v) => setField("staff",     "totalIll",         v)} /></td>
            </tr>
          </tbody>
        </table>

        {/* Outcomes */}
        <table className="flex-1 border-collapse">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-xs font-semibold text-left px-3 py-2 text-muted-foreground uppercase tracking-wide whitespace-nowrap border-r">
                Outcomes
              </th>
              <th className={headClass}>Residents</th>
              <th className={headClass}>Staff</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className={metricLabelClass}>CXR + Pneumonia</td>
              <td className={cellClass}><StatCell value={stats.residents.cxrPneumonia}    onChange={(v) => setField("residents", "cxrPneumonia",    v)} /></td>
              <td className={cellClass}><StatCell value={stats.staff.cxrPneumonia}        onChange={(v) => setField("staff",     "cxrPneumonia",    v)} /></td>
            </tr>
            <tr className="border-b">
              <td className={metricLabelClass}>Hospitalizations</td>
              <td className={cellClass}><StatCell value={stats.residents.hospitalizations} onChange={(v) => setField("residents", "hospitalizations", v)} /></td>
              <td className={cellClass}><StatCell value={stats.staff.hospitalizations}     onChange={(v) => setField("staff",     "hospitalizations", v)} /></td>
            </tr>
            <tr>
              <td className={metricLabelClass}>Deaths</td>
              <td className={cellClass}><StatCell value={stats.residents.deaths}           onChange={(v) => setField("residents", "deaths",           v)} /></td>
              <td className={cellClass}><StatCell value={stats.staff.deaths}               onChange={(v) => setField("staff",     "deaths",           v)} /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Case Definition Assessment ───────────────────────────────────────────────

// Columns whose names indicate an ARI-relevant respiratory symptom
const ARI_SYMPTOM_RE =
  /\b(fever|cough|sore.?throat|runny.?nose|congestion|shortness.of.breath|sob|loss.of.taste|loss.of.smell)\b/i;

function findCol(cols: string[], ...pats: RegExp[]): string | null {
  for (const p of pats) {
    const found = cols.find((c) => p.test(c));
    if (found) return found;
  }
  return null;
}

function flagged(val: LinelistRow[string]): boolean {
  const s = String(val ?? "").trim().toLowerCase();
  return ["y", "yes", "true", "1", "positive", "confirmed"].includes(s);
}

function parseDate(val: LinelistRow[string]): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? null : d;
}

type DefStatus = "confirmed" | "suspect" | "none";
type DefResult = { status: DefStatus; criterion: string; summary: string; noDate: boolean };

function assessCaseDefinition(linelist: LinelistData | null): DefResult {
  if (!linelist || linelist.rows.length === 0)
    return { status: "none", criterion: "", summary: "No line list uploaded.", noDate: false };

  const { columns: cols, rows } = linelist;

  const onsetCol = findCol(cols,
    /onset/i, /symptom.date/i, /date.ill/i, /illness.date/i,
    /date.onset/i, /date.of.illness/i,
  );
  const labCol  = findCol(cols,
    /lab.confirm/i, /\bconfirmed\b/i, /lab.result/i,
    /test.result/i, /\bpcr\b/i, /lab.status/i,
  );
  const unitCol = findCol(cols, /\bunit\b/i, /\bfloor\b/i, /\bward\b/i, /\barea\b/i, /\blocation\b/i);
  const diagCol = findCol(cols, /diagnosis/i, /pathogen/i, /\bagent\b/i);
  const fluCol  = findCol(cols, /\binfluenza\b/i, /\bflu\b/i);

  const ariCols = cols.filter((c) => ARI_SYMPTOM_RE.test(c));

  function isARI(row: LinelistRow): boolean {
    if (ariCols.length > 0) return ariCols.some((c) => flagged(row[c]));
    if (diagCol)
      return /\b(ari|respiratory|influenza|flu\b|cold|cough|pneumonia)\b/i.test(String(row[diagCol] ?? ""));
    return false;
  }

  function isLabConfirmed(row: LinelistRow): boolean {
    return labCol ? flagged(row[labCol]) : false;
  }

  function isInfluenzaConfirmed(row: LinelistRow): boolean {
    if (fluCol && flagged(row[fluCol])) return true;
    if (labCol && /influenza|flu\b/i.test(String(row[labCol] ?? ""))) return true;
    if (diagCol && labCol &&
        /influenza|flu\b/i.test(String(row[diagCol] ?? "")) &&
        flagged(row[labCol])) return true;
    return false;
  }

  // Returns whether >= minCount ARI cases share a common epi link within 48 h
  function clusterCheck(cases: LinelistRow[], minCount: number): { met: boolean; noDate: boolean } {
    if (cases.length < minCount) return { met: false, noDate: false };

    const byUnit = new Map<string, LinelistRow[]>();
    for (const row of cases) {
      const key = (unitCol ? String(row[unitCol] ?? "").trim() : "") || "__all__";
      const g = byUnit.get(key) ?? [];
      g.push(row);
      byUnit.set(key, g);
    }

    for (const group of byUnit.values()) {
      if (group.length < minCount) continue;
      if (!onsetCol) return { met: true, noDate: true };

      const dates = group.map((r) => parseDate(r[onsetCol])).filter((d): d is Date => d !== null);
      if (dates.length < minCount) {
        if (group.length >= minCount) return { met: true, noDate: true };
        continue;
      }

      dates.sort((a, b) => a.getTime() - b.getTime());

      for (let i = 0; i <= dates.length - minCount; i++) {
        const windowEnd = dates[i].getTime() + 48 * 3_600_000;
        const inWindow  = dates.filter((d) => d.getTime() >= dates[i].getTime() && d.getTime() <= windowEnd);
        if (inWindow.length >= minCount) return { met: true, noDate: false };
      }
    }

    return { met: false, noDate: false };
  }

  const ariCases = rows.filter(isARI);
  const labARI   = ariCases.filter(isLabConfirmed);

  // Confirmed A: ≥2 ARI within 48 h, common link, ≥1 lab-confirmed
  if (labARI.length >= 1) {
    const c = clusterCheck(ariCases, 2);
    if (c.met) {
      return {
        status:    "confirmed",
        criterion: "A",
        summary:   `${ariCases.length} ARI case${ariCases.length !== 1 ? "s" : ""} (${labARI.length} lab-confirmed) with a common epidemiological link${c.noDate ? "" : " within 48 h"}.`,
        noDate:    c.noDate,
      };
    }
  }

  // Confirmed B: ≥3 ARI within 48 h, common link (no lab required)
  {
    const c = clusterCheck(ariCases, 3);
    if (c.met) {
      return {
        status:    "confirmed",
        criterion: "B",
        summary:   `${ariCases.length} ARI case${ariCases.length !== 1 ? "s" : ""} with a common epidemiological link${c.noDate ? "" : " within 48 h"} (lab confirmation not required).`,
        noDate:    c.noDate,
      };
    }
  }

  // Suspect B: ≥1 lab-confirmed influenza
  const fluCases = rows.filter(isInfluenzaConfirmed);
  if (fluCases.length >= 1) {
    return {
      status:    "suspect",
      criterion: "B",
      summary:   `${fluCases.length} lab-confirmed influenza case${fluCases.length !== 1 ? "s" : ""} detected.`,
      noDate:    false,
    };
  }

  // Suspect A: ≥2 ARI within 48 h, common link
  {
    const c = clusterCheck(ariCases, 2);
    if (c.met) {
      return {
        status:    "suspect",
        criterion: "A",
        summary:   `${ariCases.length} ARI case${ariCases.length !== 1 ? "s" : ""} with a common epidemiological link${c.noDate ? "" : " within 48 h"}.`,
        noDate:    c.noDate,
      };
    }
  }

  return {
    status:    "none",
    criterion: "",
    summary:
      ariCases.length === 0
        ? "No ARI cases detected in the line list."
        : `${ariCases.length} ARI case${ariCases.length !== 1 ? "s" : ""} found — outbreak criteria not yet met.`,
    noDate: false,
  };
}

function CaseDefinitionCard({ result }: { result: DefResult }) {
  const { status, criterion, summary, noDate } = result;

  const badgeLabel =
    status === "confirmed" ? "Confirmed Outbreak" :
    status === "suspect"   ? "Suspect Outbreak"   : "Criteria Not Met";

  const badgeCls =
    status === "confirmed" ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" :
    status === "suspect"   ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" :
                             "bg-muted text-muted-foreground";

  const cardBorderCls =
    status === "confirmed" ? "border-red-200 dark:border-red-900/50" :
    status === "suspect"   ? "border-amber-200 dark:border-amber-900/50" :
                             "border-border";

  const confirmedBoxCls = status === "confirmed"
    ? "border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20"
    : "border-border";

  const suspectBoxCls = status === "suspect"
    ? "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20"
    : "border-border";

  return (
    <div className={`rounded-xl border bg-card overflow-hidden ${cardBorderCls}`}>
      <div className="px-4 pt-3 pb-2 border-b flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Respiratory Case Definition</h2>
        <span className={`shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full ${badgeCls}`}>
          {badgeLabel}
        </span>
      </div>

      <div className="px-4 py-3 space-y-3">
        <p className="text-xs text-muted-foreground">{summary}</p>

        {noDate && (
          <p className="text-[11px] text-amber-700 dark:text-amber-400">
            No onset date column detected — the 48-hour window was assumed based on case count and common link.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
          {/* Confirmed */}
          <div className={`rounded-lg border p-3 space-y-2 ${confirmedBoxCls}`}>
            <p className="font-semibold text-xs text-foreground">Confirmed</p>

            <div className={`pl-2.5 border-l-2 space-y-0.5 ${status === "confirmed" && criterion === "A" ? "border-red-400" : "border-transparent"}`}>
              <p className="font-medium text-foreground">A.</p>
              <p className="text-muted-foreground leading-relaxed">
                2 ARI cases within 48 h, common epidemiological link, ≥1 lab-confirmed
              </p>
            </div>

            <p className="text-center text-[10px] text-muted-foreground/50">OR</p>

            <div className={`pl-2.5 border-l-2 space-y-0.5 ${status === "confirmed" && criterion === "B" ? "border-red-400" : "border-transparent"}`}>
              <p className="font-medium text-foreground">B.</p>
              <p className="text-muted-foreground leading-relaxed">
                3 ARI cases within 48 h, common link (no lab required)
              </p>
            </div>
          </div>

          {/* Suspect */}
          <div className={`rounded-lg border p-3 space-y-2 ${suspectBoxCls}`}>
            <p className="font-semibold text-xs text-foreground">Suspect</p>

            <div className={`pl-2.5 border-l-2 space-y-0.5 ${status === "suspect" && criterion === "A" ? "border-amber-400" : "border-transparent"}`}>
              <p className="font-medium text-foreground">A.</p>
              <p className="text-muted-foreground leading-relaxed">
                2 ARI cases within 48 h with a common epidemiological link
              </p>
            </div>

            <p className="text-center text-[10px] text-muted-foreground/50">OR</p>

            <div className={`pl-2.5 border-l-2 space-y-0.5 ${status === "suspect" && criterion === "B" ? "border-amber-400" : "border-transparent"}`}>
              <p className="font-medium text-foreground">B.</p>
              <p className="text-muted-foreground leading-relaxed">
                1 lab-confirmed influenza case
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const record = useOutbreak();
  const { stats, setField } = useOutbreakStats(record.id);
  const { data: linelist } = useLinelist(record.id);

  const caseDefResult = useMemo(() => assessCaseDefinition(linelist), [linelist]);

  return (
    <>
      <OutbreakStatsTables stats={stats} setField={setField} />
      <CaseDefinitionCard result={caseDefResult} />
    </>
  );
}
