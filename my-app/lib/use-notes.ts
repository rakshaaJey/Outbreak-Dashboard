"use client";

import { useState, useEffect, useCallback } from "react";

export interface OutbreakNote {
  id: string;
  body: string;
  contactDate: string;
  contactTime: string;
  createdAt: string;
  lastEditedAt: string;
}

const KEY = (id: string) => `trace-notes-${id}`;

export function useNotes(outbreakId: string) {
  const [notes, setNotes] = useState<OutbreakNote[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY(outbreakId));
      if (stored) setNotes(JSON.parse(stored));
    } catch {}
    setLoaded(true);
  }, [outbreakId]);

  const addNote = useCallback(
    (data: Pick<OutbreakNote, "body" | "contactDate" | "contactTime">) => {
      setNotes((prev) => {
        const now = new Date().toISOString();
        const next = [
          { ...data, id: crypto.randomUUID(), createdAt: now, lastEditedAt: now },
          ...prev,
        ];
        try { localStorage.setItem(KEY(outbreakId), JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [outbreakId],
  );

  const updateNote = useCallback(
    (id: string, data: Pick<OutbreakNote, "body" | "contactDate" | "contactTime">) => {
      setNotes((prev) => {
        const next = prev.map((n) =>
          n.id === id ? { ...n, ...data, lastEditedAt: new Date().toISOString() } : n,
        );
        try { localStorage.setItem(KEY(outbreakId), JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [outbreakId],
  );

  const removeNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id);
        try { localStorage.setItem(KEY(outbreakId), JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [outbreakId],
  );

  return { notes, loaded, addNote, updateNote, removeNote };
}
