"use client";

import { useState } from "react";
import { CheckCircle2, Upload, X, Download } from "lucide-react";
import { useManagedOutbreaks } from "@/lib/managed-outbreaks";
import Papa from "papaparse";

const SETTINGS = [
  "Hospital-Acute",
  "Hospital-Psych",
  "LTCH",
  "Retirement Home",
  "Transitional Care",
  "Other",
];
const TYPES = ["Respiratory", "Gastroenteric", "Other"];

const fieldClass =
  "w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring";
const labelClass = "text-xs font-medium mb-1 block";
const errorClass = "text-xs text-destructive mt-1";

const EMPTY = {
  institutionName: "",
  address: "",
  setting: "",
  type: "",
  causativeAgent: "",
  startDate: "",
  affectedFloors: "",
  facilityContact: "",
  outbreakNumber: "",
};

type FormState = typeof EMPTY;

export default function IntakePage() {
  const { addOutbreak } = useManagedOutbreaks();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function downloadTemplate() {
    const headers = [
      "Last Name", "First Name", "Gender", "Role",
      "Address", "City", "Phone", "Email", "Building / Unit",
      "Symptom Onset Date",
      "Fever", "Cough", "Shortness of Breath", "Fatigue",
      "Headache", "Sore Throat", "Myalgia", "Chills", "Asymptomatic",
      "Testing Status", "Testing Result",
      "Classification", "Current Status", "Disposition", "Comments",
    ];
    const example = [
      "Smith", "Jane", "Female", "Resident",
      "123 Main St", "Toronto", "416-555-0100", "", "Floor 3 / Room 302",
      "2024-11-10",
      "Yes", "Yes", "No", "Yes",
      "No", "No", "No", "Yes", "No",
      "Complete", "Positive",
      "Confirmed", "Recovered", "Home isolation", "Vaccinated x3",
    ];
    const csv = [headers, example].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "linelist_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function setField<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.institutionName.trim()) errs.institutionName = "Required";
    if (!form.address.trim())         errs.address         = "Required";
    if (!form.setting)                errs.setting         = "Required";
    if (!form.type)                   errs.type            = "Required";
    if (!form.startDate)              errs.startDate       = "Required";
    if (!form.affectedFloors.trim())  errs.affectedFloors  = "Required";
    if (!form.facilityContact.trim()) errs.facilityContact = "Required";
    if (!form.outbreakNumber.trim())  errs.outbreakNumber  = "Required";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const outbreak = addOutbreak({
        institutionName: form.institutionName.trim(),
        address: form.address.trim(),
        setting: form.setting,
        type: form.type,
        causativeAgent: form.causativeAgent.trim(),
        startDate: form.startDate,
        endDate: "",
        agentIdentifiedDate: "",
        active: true,
        outbreakNumber: form.outbreakNumber.trim(),
        investigator: "",
        facilityContact: form.facilityContact.trim(),
        affectedFloors: form.affectedFloors.trim(),
        assigned: false,
      });

      if (csvFile && outbreak) {
        const text = await csvFile.text();
        const result = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
        });
        const columns = result.meta.fields ?? [];
        const listData = { columns, rows: result.data, fileName: csvFile.name };
        try {
          localStorage.setItem(`trace-linelist-${outbreak.id}`, JSON.stringify(listData));
        } catch {}
      }

      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full py-20 px-4">
        <CheckCircle2 className="h-14 w-14 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Report Submitted</h2>
        <p className="text-muted-foreground text-sm text-center max-w-sm">
          Your suspected outbreak has been reported and is pending review by the public health outbreak team.
        </p>
        <button
          onClick={() => { setForm(EMPTY); setCsvFile(null); setSubmitted(false); }}
          className="mt-6 text-sm text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          Submit another report
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full px-4 py-10">
      <div className="max-w-xl w-full mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">TRACE</p>
          <h1 className="text-2xl font-bold">Report a Suspected Outbreak</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete this form to notify the public health outbreak team. Fields marked * are required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Facility info */}
          <div>
            <label className={labelClass}>Facility / Institution Name *</label>
            <input
              className={fieldClass}
              value={form.institutionName}
              onChange={(e) => setField("institutionName", e.target.value)}
              placeholder="e.g. Sunnybrook Health Sciences – 4 West"
            />
            {errors.institutionName && <p className={errorClass}>{errors.institutionName}</p>}
          </div>

          <div>
            <label className={labelClass}>Facility Address *</label>
            <input
              className={fieldClass}
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="2075 Bayview Ave, Toronto, ON M4N 3M5"
            />
            {errors.address && <p className={errorClass}>{errors.address}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Facility Setting *</label>
              <select
                className={fieldClass}
                value={form.setting}
                onChange={(e) => setField("setting", e.target.value)}
              >
                <option value="">Select…</option>
                {SETTINGS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.setting && <p className={errorClass}>{errors.setting}</p>}
            </div>
            <div>
              <label className={labelClass}>Outbreak Type *</label>
              <select
                className={fieldClass}
                value={form.type}
                onChange={(e) => setField("type", e.target.value)}
              >
                <option value="">Select…</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.type && <p className={errorClass}>{errors.type}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date Symptoms First Noted *</label>
              <input
                type="date"
                className={fieldClass}
                value={form.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
              />
              {errors.startDate && <p className={errorClass}>{errors.startDate}</p>}
            </div>
            <div>
              <label className={labelClass}>Suspected Agent</label>
              <input
                className={fieldClass}
                value={form.causativeAgent}
                onChange={(e) => setField("causativeAgent", e.target.value)}
                placeholder="e.g. Influenza A, Pending"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Affected Area / Floor(s) *</label>
            <input
              className={fieldClass}
              value={form.affectedFloors}
              onChange={(e) => setField("affectedFloors", e.target.value)}
              placeholder="e.g. 3rd Floor, 4th Floor West"
            />
            {errors.affectedFloors && <p className={errorClass}>{errors.affectedFloors}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Facility Contact (name &amp; phone) *</label>
              <textarea
                className={`${fieldClass} resize-none`}
                rows={2}
                value={form.facilityContact}
                onChange={(e) => setField("facilityContact", e.target.value)}
                placeholder={"Jane Smith – 416-555-0100"}
              />
              {errors.facilityContact && <p className={errorClass}>{errors.facilityContact}</p>}
            </div>
            <div>
              <label className={labelClass}>Outbreak Number *</label>
              <input
                className={fieldClass}
                value={form.outbreakNumber}
                onChange={(e) => setField("outbreakNumber", e.target.value)}
                placeholder="e.g. 2024-0042"
              />
              {errors.outbreakNumber && <p className={errorClass}>{errors.outbreakNumber}</p>}
            </div>
          </div>

          {/* Line list upload */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelClass} style={{ marginBottom: 0 }}>Line List (optional — CSV)</label>
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download template
              </button>
            </div>
            {csvFile ? (
              <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/40 text-sm">
                <span className="flex-1 truncate text-foreground font-medium">{csvFile.name}</span>
                <button
                  type="button"
                  onClick={() => setCsvFile(null)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground text-sm pointer-events-none">
                  <Upload className="h-5 w-5" />
                  <span>Click to upload or drag &amp; drop</span>
                  <span className="text-xs">CSV files only</span>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors mt-2"
          >
            {submitting ? "Submitting…" : "Submit Outbreak Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
