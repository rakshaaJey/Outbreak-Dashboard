"use client";

import { createContext, useContext } from "react";
import type { ManagedOutbreak } from "@/lib/managed-outbreaks";

const OutbreakContext = createContext<ManagedOutbreak | null>(null);

export const OutbreakProvider = OutbreakContext.Provider;

export function useOutbreak(): ManagedOutbreak {
  const ctx = useContext(OutbreakContext);
  if (!ctx) throw new Error("useOutbreak must be used within OutbreakProvider");
  return ctx;
}
