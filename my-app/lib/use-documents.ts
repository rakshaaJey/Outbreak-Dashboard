"use client";

import { useState, useEffect, useCallback } from "react";

export type InteractionType = "telephone" | "written" | "in-person";

export interface OutbreakDocument {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dataUrl: string;
  interactionDate: string;
  interactionTime: string;
  interactionType: InteractionType;
  isLabResult?: boolean;
  uploadedAt: string;
}

const DOCS_KEY = (id: string) => `trace-docs-${id}`;

export function useDocuments(outbreakId: string) {
  const [documents, setDocuments] = useState<OutbreakDocument[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DOCS_KEY(outbreakId));
      if (stored) setDocuments(JSON.parse(stored));
    } catch {}
    setLoaded(true);
  }, [outbreakId]);

  const addDocument = useCallback((doc: Omit<OutbreakDocument, "id" | "uploadedAt">) => {
    const entry: OutbreakDocument = {
      ...doc,
      id: crypto.randomUUID(),
      uploadedAt: new Date().toISOString(),
    };
    setDocuments((prev) => {
      const next = [entry, ...prev];
      try { localStorage.setItem(DOCS_KEY(outbreakId), JSON.stringify(next)); } catch {}
      return next;
    });
  }, [outbreakId]);

  const removeDocument = useCallback((id: string) => {
    setDocuments((prev) => {
      const next = prev.filter((d) => d.id !== id);
      try { localStorage.setItem(DOCS_KEY(outbreakId), JSON.stringify(next)); } catch {}
      return next;
    });
  }, [outbreakId]);

  return { documents, loaded, addDocument, removeDocument };
}
