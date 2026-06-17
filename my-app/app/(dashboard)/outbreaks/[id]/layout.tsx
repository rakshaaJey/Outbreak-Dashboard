"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
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
  Phone,
  User,
  Hash,
  Layers,
  Download,
  Loader2,
} from "lucide-react";
import { useManagedOutbreaks } from "@/lib/managed-outbreaks";
import { AddOutbreakSheet } from "@/components/ui/add-outbreak-sheet";
import { OutbreakProvider } from "@/lib/outbreak-context";

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

const TABS = [
  { label: "Overview",      slug: ""              },
  { label: "Epi Curve",     slug: "epicurve"      },
  { label: "Line List",     slug: "linelist"      },
  { label: "Notes",         slug: "notes"         },
  { label: "Documentation", slug: "documentation" },
] as const;

export default function OutbreakLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const { outbreaks, loaded, updateOutbreak } = useManagedOutbreaks();
  const [editOpen, setEditOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const record = useMemo(
    () => outbreaks.find((o) => o.outbreakNumber === id || o.id === id) ?? null,
    [outbreaks, id],
  );

  async function handleExport() {
    if (!record) return;
    setExporting(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // ── 1. Outbreak summary ──────────────────────────────────────────────
      const lines = [
        "OUTBREAK EXPORT",
        `Generated: ${new Date().toLocaleString("en-CA")}`,
        "",
        "OUTBREAK DETAILS",
        `Outbreak #:        ${record.outbreakNumber  || "N/A"}`,
        `Institution:       ${record.institutionName}`,
        `Address:           ${record.address}`,
        `Setting:           ${record.setting}`,
        `Type:              ${record.type}`,
        `Causative Agent:   ${record.causativeAgent  || "Unknown / Pending"}`,
        "",
        "TIMELINE",
        `Declared Date:     ${record.startDate}`,
        `End Date:          ${record.endDate          || "Ongoing"}`,
        `Agent Identified:  ${record.agentIdentifiedDate || "Pending"}`,
        `Status:            ${record.active ? "Active" : "Declared Over"}`,
        "",
        "LOCATION",
        `Affected Floor(s): ${record.affectedFloors  || "N/A"}`,
        "",
        "ADMINISTRATIVE",
        `Investigator:      ${record.investigator     || "N/A"}`,
        `Facility Contact:  ${record.facilityContact  || "N/A"}`,
      ];
      zip.file("outbreak-summary.txt", lines.join("\n"));

      // ── 2. Outbreak stats CSV ────────────────────────────────────────────
      try {
        const statsRaw = localStorage.getItem(`trace-stats-${record.id}`);
        if (statsRaw) {
          const s = JSON.parse(statsRaw);
          const csv = [
            "Metric,Residents,Staff",
            `Total Population,${s.residents.totalPopulation},${s.staff.totalPopulation}`,
            `Population in Outbreak Area,${s.residents.populationInArea},${s.staff.populationInArea}`,
            `Flu Vax Rate,${s.residents.fluVaxRate},${s.staff.fluVaxRate}`,
            `Total Ill,${s.residents.totalIll},${s.staff.totalIll}`,
            `CXR + Pneumonia,${s.residents.cxrPneumonia},${s.staff.cxrPneumonia}`,
            `Hospitalizations,${s.residents.hospitalizations},${s.staff.hospitalizations}`,
            `Deaths,${s.residents.deaths},${s.staff.deaths}`,
          ].join("\n");
          zip.file("outbreak-stats.csv", csv);
        }
      } catch {}

      // ── 3. Notes ─────────────────────────────────────────────────────────
      try {
        const notesRaw = localStorage.getItem(`trace-notes-${record.id}`);
        if (notesRaw) {
          const notes: Array<{
            body: string;
            contactDate: string;
            contactTime: string;
            createdAt: string;
            lastEditedAt: string;
          }> = JSON.parse(notesRaw);
          if (notes.length > 0) {
            const divider = "─".repeat(60);
            const header = [
              "OUTBREAK NOTES",
              `Generated: ${new Date().toLocaleString("en-CA")}`,
              `Outbreak #: ${record.outbreakNumber || record.id}`,
              "",
            ].join("\n");
            const entries = notes.map((n, i) => [
              divider,
              `[${i + 1}] Contact: ${n.contactDate} · ${n.contactTime}`,
              `    Added:   ${new Date(n.createdAt).toLocaleString("en-CA")}`,
              n.lastEditedAt !== n.createdAt
                ? `    Edited:  ${new Date(n.lastEditedAt).toLocaleString("en-CA")}`
                : null,
              "",
              n.body,
            ].filter(Boolean).join("\n"));
            zip.file("notes.txt", header + entries.join("\n\n") + "\n");
          }
        }
      } catch {}

      // ── 4. Line list CSV ────────────────────────────────────────────────
      try {
        const listRaw = localStorage.getItem(`trace-linelist-${record.id}`);
        if (listRaw) {
          const list = JSON.parse(listRaw);
          const { utils } = await import("xlsx");
          const ws = utils.json_to_sheet(list.rows);
          const csv = utils.sheet_to_csv(ws);
          zip.file("linelist.csv", csv);
        }
      } catch {}

      // ── 5. Documents folder ──────────────────────────────────────────────
      try {
        const docsRaw = localStorage.getItem(`trace-docs-${record.id}`);
        if (docsRaw) {
          const docs: Array<{
            fileName: string;
            dataUrl: string;
            interactionDate: string;
            interactionTime: string;
            interactionType: string;
            isLabResult?: boolean;
          }> = JSON.parse(docsRaw);
          const folder = zip.folder("documents")!;
          for (const doc of docs) {
            const base64 = doc.dataUrl.split(",")[1] ?? "";
            const timeSlug = doc.interactionTime.replace(":", "-");
            const labTag = doc.isLabResult ? "LAB_" : "";
            const prefix = `${doc.interactionDate}_${timeSlug}_${doc.interactionType}_${labTag}`;
            folder.file(prefix + doc.fileName, base64, { base64: true });
          }
        }
      } catch {}

      // ── Download ─────────────────────────────────────────────────────────
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      const slug = record.outbreakNumber || record.institutionName.replace(/[^a-z0-9]/gi, "_").slice(0, 40);
      a.download = `outbreak_${slug}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

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
        <button
          onClick={() => router.push("/outbreaks")}
          className="text-sm text-muted-foreground underline underline-offset-2"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top bar */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b flex items-center gap-3">
        <button
          onClick={() => router.push("/outbreaks")}
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
          onClick={handleExport}
          disabled={exporting}
          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
          aria-label="Export outbreak"
          title="Export as ZIP"
        >
          {exporting
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Download className="h-4 w-4" />}
        </button>
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
            <DetailRow icon={<Calendar     className="h-4 w-4" />} label="Outbreak Declared Date" value={record.startDate} />
            <DetailRow icon={<Calendar     className="h-4 w-4" />} label="Outbreak End Date"       value={record.endDate || ""} />
            <DetailRow icon={<FlaskConical className="h-4 w-4" />} label="Agent Identified"         value={record.agentIdentifiedDate || ""} />
            <DetailRow icon={<Clock        className="h-4 w-4" />} label="Status"                   value={record.active ? "Ongoing" : "Declared Over"} />
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Location</h2>
            <DetailRow icon={<MapPin className="h-4 w-4" />} label="Address"           value={record.address} />
            <DetailRow icon={<Layers className="h-4 w-4" />} label="Affected Floor(s)" value={record.affectedFloors || ""} />
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Administrative</h2>
            <DetailRow icon={<Hash  className="h-4 w-4" />} label="Outbreak #"       value={record.outbreakNumber || ""} />
            <DetailRow icon={<User  className="h-4 w-4" />} label="Investigator"     value={record.investigator || ""} />
            <DetailRow icon={<Phone className="h-4 w-4" />} label="Facility Contact" value={record.facilityContact || ""} />
          </div>
        </div>

        {/* Right: tab bar + page content */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Tab nav */}
          <div className="shrink-0 border-b px-5 flex gap-0">
            {TABS.map(({ label, slug }) => {
              const href = slug ? `/outbreaks/${id}/${slug}` : `/outbreaks/${id}`;
              const active = pathname === href;
              return (
                <Link
                  key={label}
                  href={href}
                  className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Sub-page content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4">
            <OutbreakProvider value={record}>
              {children}
            </OutbreakProvider>
          </div>
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
