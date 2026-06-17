"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useCallback } from "react";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Building2,
  Activity,
  Microscope,
  ClipboardList,
  Stethoscope,
  FlaskConical,
  ExternalLink,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { SYMPTOM_KEYS } from "@/lib/linelist-data";
import type { LinelistCase } from "@/lib/linelist-data";
import { useCases } from "@/lib/use-cases";

// ─── Style maps ───────────────────────────────────────────────────────────────

const CLASSIFICATION_STYLES: Record<string, string> = {
  Confirmed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  Probable: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  "Does Not Meet Definition": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const RESULT_STYLES: Record<string, string> = {
  Positive: "text-red-600 dark:text-red-400 font-semibold",
  Negative: "text-green-600 dark:text-green-400 font-semibold",
  Pending: "text-amber-600 dark:text-amber-400 font-semibold",
  Unknown: "text-muted-foreground",
  Indeterminate: "text-purple-600 dark:text-purple-400 font-semibold",
};

const STATUS_STYLES: Record<string, string> = {
  Recovered: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  Active: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  Hospitalized: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  "Lost to Follow-Up": "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

// ─── Field components ─────────────────────────────────────────────────────────

const INPUT_CLS =
  "flex-1 px-2.5 py-1 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring";
const SELECT_CLS =
  "flex-1 px-2.5 py-1 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring";

function Field({
  label,
  value,
  editing,
  onChange,
  type = "text",
  options,
  children,
}: {
  label: string;
  value?: string;
  editing: boolean;
  onChange?: (v: string) => void;
  type?: "text" | "date" | "email" | "tel" | "select";
  options?: string[];
  children?: React.ReactNode;
}) {
  const displayValue = children ?? (value || "—");

  return (
    <div className="flex items-start gap-2 py-2.5 border-b last:border-0">
      <p className="text-xs text-muted-foreground w-32 shrink-0 pt-1.5">{label}</p>
      {editing && onChange ? (
        type === "select" && options ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={SELECT_CLS}
          >
            {options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={INPUT_CLS}
          />
        )
      ) : (
        <div className="text-sm font-medium flex-1 pt-0.5">{displayValue}</div>
      )}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { cases, updateCase } = useCases();

  const c = cases.find((x) => x.id === id);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LinelistCase | null>(null);

  const startEdit = useCallback(() => {
    if (c) {
      setDraft({ ...c });
      setEditing(true);
    }
  }, [c]);

  const cancel = useCallback(() => {
    setDraft(null);
    setEditing(false);
  }, []);

  const save = useCallback(() => {
    if (draft) {
      updateCase(draft.id, draft);
      setEditing(false);
      setDraft(null);
    }
  }, [draft, updateCase]);

  const patch = useCallback(
    <K extends keyof LinelistCase>(key: K, value: LinelistCase[K]) => {
      setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    []
  );

  if (!c) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 p-6">
        <p className="text-sm text-red-500">Case not found.</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground underline underline-offset-2"
        >
          Go back
        </button>
      </div>
    );
  }

  // Use draft data when editing, committed data otherwise
  const data = (editing && draft) ? draft : c;

  const classLabel = data.classification === "Does Not Meet Definition" ? "DNM" : data.classification;
  const activeSymptoms = SYMPTOM_KEYS.filter((s) => data[s.key] as boolean);
  const initials = `${data.firstName[0] ?? "?"}${data.lastName[0] ?? "?"}`.toUpperCase();

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

        <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
          {initials}
        </span>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex gap-2">
              <input
                value={draft?.firstName ?? ""}
                onChange={(e) => patch("firstName", e.target.value)}
                className="w-28 text-sm border rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                placeholder="First name"
              />
              <input
                value={draft?.lastName ?? ""}
                onChange={(e) => patch("lastName", e.target.value)}
                className="w-28 text-sm border rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
                placeholder="Last name"
              />
            </div>
          ) : (
            <h1 className="text-xl font-bold truncate">
              {data.lastName}, {data.firstName}
            </h1>
          )}
          <p className="text-sm text-muted-foreground">{data.gender} · {data.role}</p>
        </div>

        {/* Classification + status badges */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-full ${
              CLASSIFICATION_STYLES[data.classification] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {classLabel}
          </span>
          <span
            className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-full ${
              STATUS_STYLES[data.currentStatus] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {data.currentStatus}
          </span>
        </div>

        {/* Edit / Save / Cancel buttons */}
        {editing ? (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={cancel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              onClick={save}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors shrink-0"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── Contact Information ── */}
          <SectionCard icon={<User className="h-4 w-4" />} title="Contact Information">
            <Field
              label="Gender"
              value={data.gender}
              editing={editing}
              onChange={(v) => patch("gender", v)}
              type="select"
              options={["Female", "Male", "Transgender", "Other", "Unknown"]}
            />
            <Field
              label="Role"
              value={data.role}
              editing={editing}
              onChange={(v) => patch("role", v)}
              type="select"
              options={["Resident", "Staff", "Patient", "Visitor", "Student", "Volunteer", "Other"]}
            />
            <Field
              label="Unit / Location"
              value={data.buildingUnit}
              editing={editing}
              onChange={(v) => patch("buildingUnit", v)}
            />
            <Field
              label="Address"
              value={data.address}
              editing={editing}
              onChange={(v) => patch("address", v)}
            />
            <Field
              label="City"
              value={data.city}
              editing={editing}
              onChange={(v) => patch("city", v)}
            />
            <Field
              label="Phone"
              value={data.phone}
              editing={editing}
              onChange={(v) => patch("phone", v)}
              type="tel"
            >
              {!editing && data.phone ? (
                <a href={`tel:${data.phone}`} className="flex items-center gap-1.5 text-sm font-medium hover:text-primary">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {data.phone}
                </a>
              ) : undefined}
            </Field>
            <Field
              label="Email"
              value={data.email}
              editing={editing}
              onChange={(v) => patch("email", v)}
              type="email"
            >
              {!editing && data.email ? (
                <a href={`mailto:${data.email}`} className="flex items-center gap-1.5 text-sm font-medium hover:text-primary break-all">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {data.email}
                </a>
              ) : undefined}
            </Field>
          </SectionCard>

          {/* ── Associated Outbreak (read-only) ── */}
          <SectionCard icon={<Building2 className="h-4 w-4" />} title="Associated Outbreak">
            <div className="flex items-start gap-2 py-2.5 border-b">
              <p className="text-xs text-muted-foreground w-32 shrink-0 pt-0.5">Facility</p>
              <span className="text-sm font-medium flex items-center gap-1.5">
                {data.outbreakName}
                <Link href={`/outbreaks/${data.outbreakId}`} className="text-muted-foreground hover:text-primary" title="View outbreak">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </span>
            </div>
            <div className="flex items-start gap-2 py-2.5 border-b">
              <p className="text-xs text-muted-foreground w-32 shrink-0 pt-0.5">Address</p>
              <span className="text-sm font-medium">{data.outbreakAddress}</span>
            </div>
            <div className="flex items-start gap-2 py-2.5 border-b">
              <p className="text-xs text-muted-foreground w-32 shrink-0 pt-0.5">Setting</p>
              <span className="text-sm font-medium">{data.outbreakSetting}</span>
            </div>
            <div className="flex items-start gap-2 py-2.5 border-b">
              <p className="text-xs text-muted-foreground w-32 shrink-0 pt-0.5">Outbreak type</p>
              <span className="text-sm font-medium">{data.outbreakType}</span>
            </div>
            <div className="flex items-start gap-2 py-2.5 border-b">
              <p className="text-xs text-muted-foreground w-32 shrink-0 pt-0.5">Causative agent</p>
              <span className="text-sm font-medium flex items-center gap-1.5">
                <Microscope className="h-3.5 w-3.5 text-muted-foreground" />
                {data.outbreakAgent}
              </span>
            </div>
            <div className="flex items-start gap-2 py-2.5">
              <p className="text-xs text-muted-foreground w-32 shrink-0 pt-0.5">Outbreak began</p>
              <span className="text-sm font-medium">{data.outbreakBegan}</span>
            </div>
          </SectionCard>

          {/* ── Symptoms ── */}
          <SectionCard icon={<Stethoscope className="h-4 w-4" />} title="Symptoms">
            <Field
              label="Onset date"
              value={data.symptomOnset}
              editing={editing}
              onChange={(v) => patch("symptomOnset", v)}
              type="date"
            >
              {!editing
                ? (data.symptomOnset || (data.asx ? "N/A (asymptomatic)" : "Not recorded"))
                : undefined}
            </Field>

            <div className="py-2.5">
              <p className="text-xs text-muted-foreground mb-2">Reported symptoms</p>
              {editing ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SYMPTOM_KEYS.map((s) => (
                    <label key={s.key as string} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!draft?.[s.key]}
                        onChange={(e) => patch(s.key as keyof LinelistCase, e.target.checked as LinelistCase[typeof s.key])}
                        className="rounded border-border accent-primary"
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              ) : activeSymptoms.length === 0 ? (
                <p className="text-sm text-muted-foreground">None reported</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {activeSymptoms.map((s) => (
                    <span
                      key={s.key as string}
                      className="inline-block text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-medium"
                    >
                      {s.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── Testing & Classification ── */}
          <SectionCard icon={<FlaskConical className="h-4 w-4" />} title="Testing & Classification">
            <Field
              label="Testing status"
              value={data.testingStatus}
              editing={editing}
              onChange={(v) => patch("testingStatus", v)}
              type="select"
              options={["Pending", "Complete", "Declined"]}
            />
            <Field
              label="Testing result"
              value={data.testingResult}
              editing={editing}
              onChange={(v) => patch("testingResult", v)}
              type="select"
              options={["Positive", "Negative", "Pending", "Indeterminate", "Unknown"]}
            >
              {!editing ? (
                <span className={`text-sm ${RESULT_STYLES[data.testingResult] ?? ""}`}>
                  {data.testingResult}
                </span>
              ) : undefined}
            </Field>
            <Field
              label="Classification"
              value={data.classification}
              editing={editing}
              onChange={(v) => patch("classification", v)}
              type="select"
              options={["Confirmed", "Probable", "Does Not Meet Definition"]}
            >
              {!editing ? (
                <span
                  className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                    CLASSIFICATION_STYLES[data.classification] ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {classLabel}
                </span>
              ) : undefined}
            </Field>
            <Field
              label="Current status"
              value={data.currentStatus}
              editing={editing}
              onChange={(v) => patch("currentStatus", v)}
              type="select"
              options={["Active", "Recovered", "Hospitalized", "Lost to Follow-Up"]}
            >
              {!editing ? (
                <span
                  className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                    STATUS_STYLES[data.currentStatus] ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {data.currentStatus}
                </span>
              ) : undefined}
            </Field>
            <Field
              label="Disposition"
              value={data.disposition}
              editing={editing}
              onChange={(v) => patch("disposition", v)}
              type="select"
              options={["", "Home isolation", "Hospital transfer", "LTFU", "Voluntary", "Involuntary", "Untraceable", "Entered in error"]}
            />
          </SectionCard>

          {/* ── Notes ── */}
          <div className="lg:col-span-2">
            <SectionCard icon={<ClipboardList className="h-4 w-4" />} title="Notes & Comments">
              {editing ? (
                <textarea
                  value={draft?.comments ?? ""}
                  onChange={(e) => patch("comments", e.target.value)}
                  rows={4}
                  placeholder="Add notes here…"
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <p className="text-sm leading-relaxed">
                  {data.comments || <span className="text-muted-foreground">No notes recorded.</span>}
                </p>
              )}
            </SectionCard>
          </div>

        </div>
      </div>
    </div>
  );
}
