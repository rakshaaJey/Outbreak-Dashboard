"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import type { ManagedOutbreak } from "@/lib/managed-outbreaks";

const SETTINGS = [
  "Hospital-Acute",
  "Hospital-Psych",
  "LTCH",
  "Retirement Home",
  "Transitional Care",
  "Other",
];

const OUTBREAK_TYPES = ["Respiratory", "Gastroenteric", "Other"];

interface AddOutbreakSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: Omit<ManagedOutbreak, "id" | "createdAt">) => void;
  /** When provided the sheet operates in edit mode, pre-filling all fields. */
  initial?: ManagedOutbreak;
}

const EMPTY_FORM = {
  institutionName: "",
  address: "",
  setting: "",
  type: "",
  causativeAgent: "",
  startDate: "",
  agentIdentifiedDate: "",
  active: true,
};

type FormState = typeof EMPTY_FORM;

const fieldClass =
  "w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring";
const labelClass = "text-xs font-medium mb-1 block";
const errorClass = "text-xs text-destructive mt-1";

function formFromOutbreak(o: ManagedOutbreak): FormState {
  return {
    institutionName: o.institutionName,
    address: o.address,
    setting: o.setting,
    type: o.type,
    causativeAgent: o.causativeAgent,
    startDate: o.startDate,
    agentIdentifiedDate: o.agentIdentifiedDate,
    active: o.active,
  };
}

export function AddOutbreakSheet({ open, onOpenChange, onAdd, initial }: AddOutbreakSheetProps) {
  const isEditing = !!initial;
  const [form, setForm] = useState<FormState>(initial ? formFromOutbreak(initial) : EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Re-initialise form every time the sheet opens so edits don't bleed across sessions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(initial ? formFromOutbreak(initial) : EMPTY_FORM);
  }, [open]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.institutionName.trim()) errs.institutionName = "Required";
    if (!form.address.trim()) errs.address = "Required";
    if (!form.setting) errs.setting = "Required";
    if (!form.type) errs.type = "Required";
    if (!form.startDate) errs.startDate = "Required";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onAdd({
      institutionName: form.institutionName.trim(),
      address: form.address.trim(),
      setting: form.setting,
      type: form.type,
      causativeAgent: form.causativeAgent.trim(),
      startDate: form.startDate,
      agentIdentifiedDate: form.agentIdentifiedDate,
      active: form.active,
    });
    setForm(EMPTY_FORM);
    setErrors({});
    onOpenChange(false);
  }

  function handleCancel() {
    setForm(EMPTY_FORM);
    setErrors({});
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Outbreak" : "Add Outbreak"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the outbreak details below."
              : "Fill in the outbreak details. Fields marked * are required."}
          </SheetDescription>
        </SheetHeader>

        {/* scrollable form body */}
        <form
          id="add-outbreak-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col gap-4"
        >
          <div>
            <label className={labelClass}>Institution Name *</label>
            <input
              className={fieldClass}
              value={form.institutionName}
              onChange={(e) => setField("institutionName", e.target.value)}
              placeholder="e.g. Toronto General Hospital – 6 East"
            />
            {errors.institutionName && <p className={errorClass}>{errors.institutionName}</p>}
          </div>

          <div>
            <label className={labelClass}>Address *</label>
            <input
              className={fieldClass}
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="200 Elizabeth St, Toronto, ON M5G 2C4"
            />
            {errors.address && <p className={errorClass}>{errors.address}</p>}
          </div>

          <div>
            <label className={labelClass}>Outbreak Setting *</label>
            <select
              className={fieldClass}
              value={form.setting}
              onChange={(e) => setField("setting", e.target.value)}
            >
              <option value="">Select setting…</option>
              {SETTINGS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.setting && <p className={errorClass}>{errors.setting}</p>}
          </div>

          <div>
            <label className={labelClass}>Type of Outbreak *</label>
            <select
              className={fieldClass}
              value={form.type}
              onChange={(e) => setField("type", e.target.value)}
            >
              <option value="">Select type…</option>
              {OUTBREAK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.type && <p className={errorClass}>{errors.type}</p>}
          </div>

          <div>
            <label className={labelClass}>Causative Agent</label>
            <input
              className={fieldClass}
              value={form.causativeAgent}
              onChange={(e) => setField("causativeAgent", e.target.value)}
              placeholder="e.g. Influenza A, Norovirus, Pending"
            />
          </div>

          <div>
            <label className={labelClass}>Outbreak Start Date *</label>
            <input
              type="date"
              className={fieldClass}
              value={form.startDate}
              onChange={(e) => setField("startDate", e.target.value)}
            />
            {errors.startDate && <p className={errorClass}>{errors.startDate}</p>}
          </div>

          <div>
            <label className={labelClass}>Agent Identified Date</label>
            <input
              type="date"
              className={fieldClass}
              value={form.agentIdentifiedDate}
              onChange={(e) => setField("agentIdentifiedDate", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 py-1">
            <input
              type="checkbox"
              id="outbreak-active"
              checked={form.active}
              onChange={(e) => setField("active", e.target.checked)}
              className="h-4 w-4 rounded border border-border accent-primary cursor-pointer"
            />
            <label htmlFor="outbreak-active" className="text-sm font-medium cursor-pointer">
              Outbreak is currently active
            </label>
          </div>
        </form>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" form="add-outbreak-form" className="flex-1">
            {isEditing ? "Save Changes" : "Add Outbreak"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
