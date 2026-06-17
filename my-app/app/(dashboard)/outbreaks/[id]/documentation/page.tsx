"use client";

import { useState, useRef } from "react";
import { FileText, Paperclip, Download, X, Phone, Users, FlaskConical } from "lucide-react";
import { useDocuments } from "@/lib/use-documents";
import type { InteractionType, OutbreakDocument } from "@/lib/use-documents";
import { useOutbreak } from "@/lib/outbreak-context";

// ─── helpers ────────────────────────────────────────────────────────────────

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const INTERACTION_LABELS: Record<InteractionType, string> = {
  telephone:  "Telephone",
  written:    "Written",
  "in-person": "In-Person",
};

const INTERACTION_COLORS: Record<InteractionType, string> = {
  telephone:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  written:    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "in-person": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

const INTERACTION_ICONS: Record<InteractionType, React.ReactNode> = {
  telephone:  <Phone    className="h-3 w-3" />,
  written:    <FileText className="h-3 w-3" />,
  "in-person": <Users    className="h-3 w-3" />,
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── page ───────────────────────────────────────────────────────────────────

export default function DocumentationPage() {
  const record = useOutbreak();
  const { documents, addDocument, removeDocument } = useDocuments(record.id);

  const [addDocOpen, setAddDocOpen] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docDate, setDocDate] = useState("");
  const [docTime, setDocTime] = useState("");
  const [docType, setDocType] = useState<InteractionType>("telephone");
  const [docIsLabResult, setDocIsLabResult] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [docSaving, setDocSaving] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  async function handleAddDocument() {
    if (!docFile || !docDate || !docTime) {
      setDocError("Please select a file and fill in all fields.");
      return;
    }
    if (docFile.size > 4 * 1024 * 1024) {
      setDocError("File must be under 4 MB.");
      return;
    }
    setDocSaving(true);
    setDocError(null);
    try {
      const dataUrl = await readFileAsDataURL(docFile);
      addDocument({
        fileName: docFile.name,
        fileSize: docFile.size,
        mimeType: docFile.type,
        dataUrl,
        interactionDate: docDate,
        interactionTime: docTime,
        interactionType: docType,
        isLabResult: docIsLabResult,
      });
      setAddDocOpen(false);
      setDocFile(null);
    } catch {
      setDocError("Failed to read the file.");
    } finally {
      setDocSaving(false);
    }
  }

  function downloadDocument(doc: OutbreakDocument) {
    const a = document.createElement("a");
    a.href = doc.dataUrl;
    const prefix = record.outbreakNumber ? `${record.outbreakNumber}_` : "";
    a.download = `${prefix}${doc.fileName}`;
    a.click();
  }

  function openUploadForm() {
    const now = new Date();
    setDocDate(now.toISOString().slice(0, 10));
    setDocTime(now.toTimeString().slice(0, 5));
    setDocType("telephone");
    setDocIsLabResult(false);
    setDocFile(null);
    setDocError(null);
    setAddDocOpen(true);
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Documents</h2>
          {documents.length > 0 && (
            <span className="text-xs text-muted-foreground">({documents.length})</span>
          )}
        </div>
        <button
          onClick={openUploadForm}
          className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-muted transition-colors"
        >
          + Upload
        </button>
      </div>

      {/* Upload form */}
      {addDocOpen && (
        <div className="px-4 py-4 border-b bg-muted/20 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New Document</p>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">File</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="text-xs px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted transition-colors flex items-center gap-1.5"
              >
                <Paperclip className="h-3.5 w-3.5" />
                {docFile ? "Change file" : "Choose file"}
              </button>
              {docFile && (
                <span className="text-xs text-muted-foreground truncate max-w-[240px]">
                  {docFile.name}{" "}
                  <span className="text-muted-foreground/60">({formatBytes(docFile.size)})</span>
                </span>
              )}
              <input
                ref={docInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  setDocFile(e.target.files?.[0] ?? null);
                  setDocError(null);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Interaction Date</label>
              <input
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className="w-full border border-border rounded-md px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Interaction Time</label>
              <input
                type="time"
                value={docTime}
                onChange={(e) => setDocTime(e.target.value)}
                className="w-full border border-border rounded-md px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Interaction Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as InteractionType)}
                className="w-full border border-border rounded-md px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="telephone">Telephone</option>
                <option value="written">Written</option>
                <option value="in-person">In-Person</option>
              </select>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={docIsLabResult}
              onChange={(e) => setDocIsLabResult(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border accent-purple-600"
            />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <FlaskConical className="h-3.5 w-3.5 text-purple-500" />
              Mark as Lab Result
            </span>
          </label>

          {docError && <p className="text-xs text-destructive">{docError}</p>}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setAddDocOpen(false); setDocFile(null); setDocError(null); }}
              className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddDocument}
              disabled={docSaving}
              className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {docSaving ? "Saving…" : "Save Document"}
            </button>
          </div>
        </div>
      )}

      {/* Document list */}
      {documents.length === 0 && !addDocOpen ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2 text-xs text-muted-foreground">
          <FileText className="h-6 w-6 opacity-30" />
          No documents uploaded yet.
        </div>
      ) : (
        <div className="divide-y">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/30 transition-colors"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => downloadDocument(doc)}
                  className="text-xs font-medium hover:underline underline-offset-2 truncate block text-left max-w-full"
                  title={doc.fileName}
                >
                  {doc.fileName}
                </button>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {doc.interactionDate} · {doc.interactionTime}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40">·</span>
                  <span className="text-[10px] text-muted-foreground">{formatBytes(doc.fileSize)}</span>
                </div>
              </div>
              {doc.isLabResult && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  <FlaskConical className="h-3 w-3" />
                  Lab Result
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                  INTERACTION_COLORS[doc.interactionType]
                }`}
              >
                {INTERACTION_ICONS[doc.interactionType]}
                {INTERACTION_LABELS[doc.interactionType]}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => downloadDocument(doc)}
                  title="Download"
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => removeDocument(doc.id)}
                  title="Remove"
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
