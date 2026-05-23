"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";

interface StatsViewProps {
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  setting: string;
  outbreakType: string;
  agent: string;
}

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

const BAR_COLORS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899",
  "#f59e0b", "#10b981", "#14b8a6", "#f97316",
  "#06b6d4", "#84cc16",
];

function parseDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function recordMatchesFilter(
  r: OutbreakRecord,
  startDate: Date | null,
  endDate: Date | null,
  status: string,
  setting: string,
  outbreakType: string,
  agent: string,
): boolean {
  const began = parseDate(r["Date Outbreak Began"]);
  if (!began) return false;
  if (startDate && began < startDate) return false;
  if (endDate && began > endDate) return false;
  if (status === "Active" && r.Active !== "Y") return false;
  if (status === "Inactive" && r.Active !== "N") return false;
  if (setting && r["Outbreak Setting"] !== setting) return false;
  if (outbreakType && r["Type of Outbreak"] !== outbreakType) return false;
  if (agent && r["Causative Agent-1"] !== agent && r["Causative Agent-2"] !== agent) return false;
  return true;
}

function countBy(
  records: OutbreakRecord[],
  key: (r: OutbreakRecord) => string
): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of records) {
    const k = key(r).trim() || "Unknown";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function groupByMonth(records: OutbreakRecord[]): { month: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of records) {
    const d = parseDate(r["Date Outbreak Began"]);
    if (!d) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${accent ?? ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h3 className="text-base font-semibold mb-3">{title}</h3>;
}

export function StatsView({ startDate, endDate, status, setting, outbreakType, agent }: StatsViewProps) {
  const [records, setRecords] = useState<OutbreakRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/outbreaks.csv");
        if (!res.ok) throw new Error(`Failed to load outbreaks.csv (${res.status})`);
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

  const filtered = useMemo(
    () => records.filter((r) => recordMatchesFilter(r, startDate, endDate, status, setting, outbreakType, agent)),
    [records, startDate, endDate, status, setting, outbreakType, agent]
  );

  const activeCount = useMemo(() => filtered.filter((r) => r.Active === "Y").length, [filtered]);
  const inactiveCount = filtered.length - activeCount;

  const avgDuration = useMemo(() => {
    const days = filtered
      .filter((r) => r["Date Declared Over"])
      .map((r) => {
        const a = parseDate(r["Date Outbreak Began"]);
        const b = parseDate(r["Date Declared Over"]);
        if (!a || !b) return null;
        return Math.round((b.getTime() - a.getTime()) / 86_400_000);
      })
      .filter((d): d is number => d !== null && d >= 0);
    return days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : null;
  }, [filtered]);

  const byType = useMemo(() => countBy(filtered, (r) => r["Type of Outbreak"]), [filtered]);
  const bySetting = useMemo(() => countBy(filtered, (r) => r["Outbreak Setting"]), [filtered]);
  const byAgent = useMemo(
    () => countBy(filtered, (r) => r["Causative Agent-1"]).slice(0, 10),
    [filtered]
  );
  const byMonth = useMemo(() => groupByMonth(filtered), [filtered]);

  // Locations with multiple outbreaks
  const byLocation = useMemo(() => countBy(filtered, (r) => r["Institution Name"]), [filtered]);
  const locationsMultiple = useMemo(() => {
    const multi = byLocation.filter((l) => l.count > 1);
    return multi
      .map((l) => {
        const rec = filtered.find((r) => (r["Institution Name"] || "").trim() === l.name);
        return { name: l.name, count: l.count, address: rec ? rec["Institution Address"] : "" };
      })
      .slice(0, 20);
  }, [byLocation, filtered]);

  const statusPie = [
    { name: "Active", value: activeCount, color: "#22c55e" },
    { name: "Inactive", value: inactiveCount, color: "#ef4444" },
  ];

  const dateLabel =
    startDate || endDate
      ? `${startDate ? startDate.toLocaleDateString() : "Beginning"} → ${endDate ? endDate.toLocaleDateString() : "Now"}`
      : "All time";

  if (loading) {
    return (
      <div className="rounded-lg border p-12 flex items-center justify-center text-sm text-muted-foreground">
        Loading statistics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border p-12 flex items-center justify-center text-sm text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader title="Summary" />
          <span className="text-xs text-muted-foreground">{dateLabel}</span>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Total Outbreaks" value={filtered.length} />
          <StatCard
            label="Active"
            value={activeCount}
            sub={filtered.length ? `${Math.round((activeCount / filtered.length) * 100)}% of total` : undefined}
            accent="text-green-600"
          />
          <StatCard
            label="Inactive"
            value={inactiveCount}
            sub={filtered.length ? `${Math.round((inactiveCount / filtered.length) * 100)}% of total` : undefined}
            accent="text-red-500"
          />
          <StatCard
            label="Avg Duration"
            value={avgDuration !== null ? `${avgDuration}d` : "—"}
            sub="for closed outbreaks"
          />
        </div>
      </div>

      {/* Active vs Inactive + By Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border p-5">
          <SectionHeader title="Active vs Inactive" />
          {mounted ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                >
                  {statusPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : null}
        </div>

        <div className="rounded-lg border p-5">
          <SectionHeader title="By Outbreak Type" />
          {mounted ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byType} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {byType.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </div>

      {/* By Setting */}
      <div className="rounded-lg border p-5">
        <SectionHeader title="Outbreaks by Setting" />
        {mounted ? (
          <ResponsiveContainer width="100%" height={Math.max(180, bySetting.length * 36)}>
            <BarChart data={bySetting} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={160} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {bySetting.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      {/* Top Causative Agents */}
      <div className="rounded-lg border p-5">
        <SectionHeader title="Top Causative Agents" />
        {mounted ? (
          <ResponsiveContainer width="100%" height={Math.max(180, byAgent.length * 36)}>
            <BarChart data={byAgent} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={200} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {byAgent.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      {/* Locations with multiple outbreaks */}
      <div className="rounded-lg border p-5">
        <SectionHeader title="Locations With Multiple Outbreaks" />
        {locationsMultiple.length ? (
          <ul className="list-none space-y-2">
            {locationsMultiple.map((loc) => (
              <li key={loc.name} className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{loc.name}</div>
                  {loc.address && <div className="text-xs text-muted-foreground">{loc.address}</div>}
                </div>
                <div className="text-sm font-semibold">{loc.count}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-muted-foreground">No locations with multiple outbreaks in the selected range.</div>
        )}
      </div>

      {/* Outbreaks over time */}
      {byMonth.length > 1 && (
        <div className="rounded-lg border p-5">
          <SectionHeader title="Outbreaks Over Time" />
          {mounted ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={byMonth} margin={{ left: 0, right: 16 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      )}
    </div>
  );
}
