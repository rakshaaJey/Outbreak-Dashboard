"use client";

import { useMemo, useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { useLinelist } from "@/lib/use-linelist";
import type { LinelistRow } from "@/lib/use-linelist";
import { LinelistUpload, LinelistUploadButton } from "@/components/ui/linelist-upload";
import { useOutbreak } from "@/lib/outbreak-context";

// ─── helpers ────────────────────────────────────────────────────────────────

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

export default function LineListPage() {
  const record = useOutbreak();
  const { data: linelist, loaded, upload, clear, addRow, updateRow } = useLinelist(record.id);

  const [addRowOpen, setAddRowOpen] = useState(false);
  const [newRowValues, setNewRowValues] = useState<Record<string, string>>({});
  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null);
  const [editRowValues, setEditRowValues] = useState<Record<string, string>>({});
  const [genderFilter, setGenderFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const detectedCols = useMemo(() => {
    if (!linelist) return null;
    const c = linelist.columns;
    return {
      gender: findCol(c, /gender/i, /sex/i),
      role:   findCol(c, /\brole\b/i),
    };
  }, [linelist]);

  const filterOptions = useMemo(() => {
    if (!linelist || !detectedCols) return { genders: [] as string[], roles: [] as string[] };
    const uniq = (col: string | null) =>
      col
        ? [...new Set(linelist.rows.map((r) => String(r[col] ?? "")).filter(Boolean))].sort()
        : [];
    return { genders: uniq(detectedCols.gender), roles: uniq(detectedCols.role) };
  }, [linelist, detectedCols]);

  const filteredRows = useMemo(() => {
    if (!linelist) return [] as { row: LinelistRow; originalIdx: number }[];
    return linelist.rows
      .map((row, originalIdx) => ({ row, originalIdx }))
      .filter(({ row }) => {
        if (genderFilter && detectedCols?.gender && String(row[detectedCols.gender] ?? "") !== genderFilter) return false;
        if (roleFilter   && detectedCols?.role   && String(row[detectedCols.role]   ?? "") !== roleFilter)   return false;
        return true;
      });
  }, [linelist, detectedCols, genderFilter, roleFilter]);

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

  const hasFilters = filterOptions.genders.length > 0 || filterOptions.roles.length > 0;

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Line List</h2>
          <p className="text-xs text-muted-foreground">
            {linelist
              ? `${filteredRows.length} of ${linelist.rows.length} row${linelist.rows.length === 1 ? "" : "s"} · ${linelist.fileName}`
              : "No line list uploaded yet"}
          </p>
        </div>
        {linelist && loaded && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const blank: Record<string, string> = {};
                linelist.columns.forEach((c) => { blank[c] = ""; });
                setNewRowValues(blank);
                setAddRowOpen(true);
              }}
              className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-muted transition-colors"
            >
              + Add Row
            </button>
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

      {/* Filter bar */}
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

      {/* Add Row form */}
      {addRowOpen && linelist && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New Row</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {linelist.columns.map((col) => (
              <div key={col}>
                <label className="text-xs text-muted-foreground block mb-0.5 truncate" title={col}>{col}</label>
                <input
                  className="w-full border border-border rounded-md px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newRowValues[col] ?? ""}
                  onChange={(e) => setNewRowValues((v) => ({ ...v, [col]: e.target.value }))}
                  placeholder="—"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setAddRowOpen(false); setNewRowValues({}); }}
              className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { addRow(newRowValues); setAddRowOpen(false); setNewRowValues({}); }}
              className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              Add Row
            </button>
          </div>
        </div>
      )}

      {/* Table / empty state */}
      {!loaded ? (
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
                <th className="px-2 py-2.5 border-b w-8" />
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
              {filteredRows.map(({ row, originalIdx }) => {
                const isEditing = editingRowIdx === originalIdx;
                return (
                  <tr key={originalIdx} className="group border-b last:border-0 hover:bg-muted/40 transition-colors">
                    {/* action cell */}
                    <td className="px-2 py-2 text-center align-middle">
                      {isEditing ? (
                        <div className="flex flex-col gap-1 items-center">
                          <button
                            title="Save"
                            onClick={() => {
                              updateRow(originalIdx, editRowValues);
                              setEditingRowIdx(null);
                              setEditRowValues({});
                            }}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Cancel"
                            onClick={() => { setEditingRowIdx(null); setEditRowValues({}); }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          title="Edit row"
                          onClick={() => {
                            const vals: Record<string, string> = {};
                            linelist.columns.forEach((c) => { vals[c] = String(row[c] ?? ""); });
                            setEditRowValues(vals);
                            setEditingRowIdx(originalIdx);
                            setAddRowOpen(false);
                          }}
                          className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                    </td>

                    {tableLayout.map((col) => {
                      if (isEditing) {
                        if (col.kind === "symptoms") {
                          return (
                            <td key="__symptoms__" className="px-3 py-1.5 align-middle">
                              <div className="flex flex-wrap gap-1">
                                {col.cols.map((s) => (
                                  <div key={s} className="flex items-center gap-0.5">
                                    <span className="text-[10px] text-muted-foreground">{s}</span>
                                    <select
                                      className="h-5 rounded border border-border bg-background px-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring"
                                      value={editRowValues[s] ?? ""}
                                      onChange={(e) => setEditRowValues((v) => ({ ...v, [s]: e.target.value }))}
                                    >
                                      <option value="">—</option>
                                      <option value="Y">Y</option>
                                      <option value="N">N</option>
                                    </select>
                                  </div>
                                ))}
                              </div>
                            </td>
                          );
                        }
                        return (
                          <td key={col.name} className="px-2 py-1.5 align-middle">
                            <input
                              className="w-full min-w-[80px] border border-border rounded px-1.5 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                              value={editRowValues[col.name] ?? ""}
                              onChange={(e) => setEditRowValues((v) => ({ ...v, [col.name]: e.target.value }))}
                            />
                          </td>
                        );
                      }

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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
