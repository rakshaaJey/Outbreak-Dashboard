"use client";

import { useRef, useState } from "react";
import { Upload, X, FileSpreadsheet, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LinelistData, LinelistRow } from "@/lib/use-linelist";

interface LinelistUploadProps {
  onUpload: (data: LinelistData) => void;
  onClear: () => void;
  currentFileName?: string;
}

export function LinelistUpload({ onUpload, onClear, currentFileName }: LinelistUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  async function parseFile(file: File) {
    setError(null);
    setParsing(true);
    try {
      const { read, utils } = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = utils.sheet_to_json<LinelistRow>(ws, { defval: "" });
      if (raw.length === 0) { setError("The spreadsheet appears to be empty."); return; }
      const columns = Object.keys(raw[0]);
      onUpload({ columns, rows: raw, fileName: file.name });
    } catch {
      setError("Could not parse the file. Make sure it is a valid .xlsx or .xls file.");
    } finally {
      setParsing(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
      setError("Please upload an .xlsx, .xls, or .csv file.");
      return;
    }
    parseFile(file);
  }

  if (currentFileName) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
        <FileSpreadsheet className="h-4 w-4 shrink-0 text-green-600" />
        <span className="truncate">{currentFileName}</span>
        <button
          onClick={onClear}
          className="ml-auto shrink-0 hover:text-destructive transition-colors"
          title="Remove uploaded file"
          aria-label="Remove uploaded line list"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-xl px-6 py-8 flex flex-col items-center gap-3 text-center transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        }`}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Upload a line list</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Drag & drop an Excel file, or{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-primary underline underline-offset-2 hover:no-underline"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls, .csv — first row must be column headers</p>
          <a
            href="/linelist-template.xlsx"
            download
            className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2 hover:no-underline mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="h-3 w-3" />
            Download example template
          </a>
        </div>
        {parsing && <p className="text-xs text-muted-foreground animate-pulse">Parsing…</p>}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// Compact trigger button for the toolbar (used when a table already exists)
export function LinelistUploadButton({ onUpload }: { onUpload: (data: LinelistData) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function parseFile(file: File) {
    setError(null);
    setParsing(true);
    try {
      const { read, utils } = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = utils.sheet_to_json<LinelistRow>(ws, { defval: "" });
      if (raw.length === 0) { setError("Empty spreadsheet."); return; }
      const columns = Object.keys(raw[0]);
      onUpload({ columns, rows: raw, fileName: file.name });
    } catch {
      setError("Could not parse file.");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={parsing}
        className="gap-1.5"
      >
        <Upload className="h-3.5 w-3.5" />
        {parsing ? "Parsing…" : "Replace file"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) parseFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
