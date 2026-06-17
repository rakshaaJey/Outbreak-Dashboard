"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, FileText } from "lucide-react";
import { useOutbreak } from "@/lib/outbreak-context";
import { useNotes, type OutbreakNote } from "@/lib/use-notes";

const fieldClass =
  "w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-CA", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Inline note editor (used for both new and existing notes) ────────────────
interface NoteEditorProps {
  initial: { body: string; contactDate: string; contactTime: string };
  onSave: (data: { body: string; contactDate: string; contactTime: string }) => void;
  onCancel: () => void;
  saveLabel?: string;
}

function NoteEditor({ initial, onSave, onCancel, saveLabel = "Save Note" }: NoteEditorProps) {
  const [body, setBody]               = useState(initial.body);
  const [contactDate, setContactDate] = useState(initial.contactDate);
  const [contactTime, setContactTime] = useState(initial.contactTime);
  const [error, setError]             = useState("");

  function handleSave() {
    if (!body.trim())        { setError("Note cannot be empty."); return; }
    if (!contactDate)        { setError("Contact date is required."); return; }
    if (!contactTime)        { setError("Contact time is required."); return; }
    onSave({ body: body.trim(), contactDate, contactTime });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Contact Date *</label>
          <input
            type="date"
            value={contactDate}
            onChange={(e) => { setContactDate(e.target.value); setError(""); }}
            className={fieldClass}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Contact Time *</label>
          <input
            type="time"
            value={contactTime}
            onChange={(e) => { setContactTime(e.target.value); setError(""); }}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">Note *</label>
        <textarea
          value={body}
          onChange={(e) => { setBody(e.target.value); setError(""); }}
          rows={5}
          placeholder="Type your note here…"
          className={`${fieldClass} resize-y min-h-[100px]`}
          autoFocus
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
        >
          <Check className="h-3.5 w-3.5" />
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

// ── Note card ─────────────────────────────────────────────────────────────────
interface NoteCardProps {
  note: OutbreakNote;
  onUpdate: (data: { body: string; contactDate: string; contactTime: string }) => void;
  onRemove: () => void;
}

function NoteCard({ note, onUpdate, onRemove }: NoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (editing) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <NoteEditor
          initial={{ body: note.body, contactDate: note.contactDate, contactTime: note.contactTime }}
          onSave={(data) => { onUpdate(data); setEditing(false); }}
          onCancel={() => setEditing(false)}
          saveLabel="Save Changes"
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 group">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold">
            Contact:{" "}
            <span className="font-normal">
              {new Date(`${note.contactDate}T${note.contactTime}`).toLocaleString("en-CA", {
                year: "numeric", month: "short", day: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            Last edited: {formatDateTime(note.lastEditedAt)}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Edit note"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {confirmDelete ? (
            <>
              <span className="text-xs text-destructive font-medium px-1">Delete?</span>
              <button
                onClick={onRemove}
                className="p-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                title="Confirm delete"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
              title="Delete note"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{note.body}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NotesPage() {
  const record = useOutbreak();
  const { notes, loaded, addNote, updateNote, removeNote } = useNotes(record.id);
  const [composing, setComposing] = useState(false);

  function openCompose() {
    setComposing(true);
  }

  function handleAdd(data: { body: string; contactDate: string; contactTime: string }) {
    addNote(data);
    setComposing(false);
  }

  function defaultDateTime() {
    const now = new Date();
    return {
      contactDate: now.toISOString().slice(0, 10),
      contactTime: now.toTimeString().slice(0, 5),
    };
  }

  if (!loaded) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Notes</h2>
          {notes.length > 0 && (
            <span className="text-xs text-muted-foreground">({notes.length})</span>
          )}
        </div>
        {!composing && (
          <button
            onClick={openCompose}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Note
          </button>
        )}
      </div>

      {/* Compose form */}
      {composing && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            New Note
          </p>
          <NoteEditor
            initial={{ body: "", ...defaultDateTime() }}
            onSave={handleAdd}
            onCancel={() => setComposing(false)}
          />
        </div>
      )}

      {/* Note list */}
      {notes.length === 0 && !composing ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No notes yet.</p>
          <button
            onClick={openCompose}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add the first note
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onUpdate={(data) => updateNote(note.id, data)}
              onRemove={() => removeNote(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
